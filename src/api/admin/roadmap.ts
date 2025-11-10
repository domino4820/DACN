import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const createRoadmapSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    topicIds: z.array(z.uuid()),
    nodes: z.array(
        z.object({
            position_x: z.number(),
            position_y: z.number(),
            node_type: z.string().default('default'),
            label: z.string(),
            content: z.string().optional(),
            level: z.enum(['REQUIRED', 'OPTIONAL']).default('OPTIONAL'),
            data: z.any().optional()
        })
    ),
    edges: z.array(
        z.object({
            source_id: z.string(),
            target_id: z.string()
        })
    )
});

const app = new Hono();

app.get('/', async (c) => {
    try {
        const roadmaps = await prisma.roadmap.findMany({
            include: {
                roadmap_topics: {
                    include: {
                        topic: true
                    }
                },
                nodes: true,
                edges: true
            }
        });

        return c.json({
            success: true,
            data: roadmaps
        });
    } catch {
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.put('/', zValidator('json', createRoadmapSchema), async (c) => {
    try {
        const { name, description, topicIds, nodes, edges } = c.req.valid('json');

        const roadmap = await prisma.$transaction(async (tx) => {
            const topics = await tx.topic.findMany({
                where: {
                    id: {
                        in: topicIds
                    }
                }
            });

            if (topics.length !== topicIds.length) {
                throw new Error('Invalid topic IDs');
            }

            const existingRoadmap = await tx.roadmap.findFirst({
                where: { name }
            });

            let newRoadmap;

            if (existingRoadmap) {
                await tx.roadmapEdge.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                await tx.roadmapNode.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                await tx.roadmapTopic.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                newRoadmap = await tx.roadmap.update({
                    where: { id: existingRoadmap.id },
                    data: {
                        description,
                        roadmap_topics: {
                            create: topicIds.map((topicId) => ({
                                topic: {
                                    connect: {
                                        id: topicId
                                    }
                                }
                            }))
                        }
                    }
                });
            } else {
                newRoadmap = await tx.roadmap.create({
                    data: {
                        name,
                        description,
                        roadmap_topics: {
                            create: topicIds.map((topicId) => ({
                                topic: {
                                    connect: {
                                        id: topicId
                                    }
                                }
                            }))
                        }
                    }
                });
            }

            return { roadmap: newRoadmap, isNew: !existingRoadmap };
        });

        const { roadmap: newRoadmap, isNew } = roadmap;

        await prisma.roadmapNode.createMany({
            data: nodes.map((node) => ({
                roadmap_id: newRoadmap.id,
                position_x: node.position_x,
                position_y: node.position_y,
                node_type: node.node_type,
                label: node.label,
                content: node.content,
                level: node.level,
                data: node.data
            }))
        });

        const createdNodesList = await prisma.roadmapNode.findMany({
            where: {
                roadmap_id: newRoadmap.id
            }
        });

        const positionToIdMap = new Map();
        for (const node of createdNodesList) {
            const key = `${Math.round(node.position_x)}_${Math.round(node.position_y)}`;
            positionToIdMap.set(key, node.id);
        }

        if (edges.length > 0) {
            await prisma.roadmapEdge.createMany({
                data: edges
                    .map((edge) => {
                        const sourceParts = edge.source_id.split('_');
                        const targetParts = edge.target_id.split('_');

                        if (sourceParts.length !== 2 || targetParts.length !== 2) {
                            return null;
                        }

                        const sourceX = Number.parseFloat(sourceParts[0] || '0');
                        const sourceY = Number.parseFloat(sourceParts[1] || '0');
                        const targetX = Number.parseFloat(targetParts[0] || '0');
                        const targetY = Number.parseFloat(targetParts[1] || '0');

                        if (Number.isNaN(sourceX) || Number.isNaN(sourceY) || Number.isNaN(targetX) || Number.isNaN(targetY)) {
                            return null;
                        }

                        const sourceKey = `${Math.round(sourceX)}_${Math.round(sourceY)}`;
                        const targetKey = `${Math.round(targetX)}_${Math.round(targetY)}`;

                        const sourceNodeId = positionToIdMap.get(sourceKey);
                        const targetNodeId = positionToIdMap.get(targetKey);

                        if (!sourceNodeId || !targetNodeId) {
                            return null;
                        }

                        return {
                            roadmap_id: newRoadmap.id,
                            source_id: sourceNodeId,
                            target_id: targetNodeId
                        };
                    })
                    .filter((edge): edge is NonNullable<typeof edge> => edge !== null)
            });
        }

        const completeRoadmap = await prisma.roadmap.findUnique({
            where: { id: newRoadmap.id },
            include: {
                roadmap_topics: {
                    include: {
                        topic: true
                    }
                },
                nodes: true,
                edges: true
            }
        });

        return c.json(
            {
                success: true,
                data: completeRoadmap
            },
            isNew ? 201 : 200
        );
    } catch {
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        const roadmap = await prisma.roadmap.findUnique({
            where: { id },
            include: {
                nodes: true,
                edges: true,
                roadmap_topics: true,
                user_paths: true
            }
        });

        if (!roadmap) {
            return c.json({
                success: true
            });
        }

        await prisma.roadmap.delete({
            where: { id }
        });

        return c.json({
            success: true
        });
    } catch {
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

export default app;
