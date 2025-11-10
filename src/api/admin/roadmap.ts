import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono();

const nodeSchema = z.object({
    id: z.string(),
    type: z.string().default('default'),
    position: z.object({
        x: z.number(),
        y: z.number()
    }),
    data: z.object({
        label: z.string(),
        content: z.string().optional(),
        level: z.enum(['REQUIRED', 'OPTIONAL']).default('OPTIONAL')
    }),
    className: z.string().optional(),
    targetPosition: z.string().optional(),
    sourcePosition: z.string().optional()
});

const edgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional()
});

const createRoadmapSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
    topicIds: z.array(z.string()).optional()
});

app.put('/', zValidator('json', createRoadmapSchema), async (c) => {
    try {
        const { name, description, nodes, edges, topicIds } = c.req.valid('json');

        const existingRoadmap = await prisma.roadmap.findFirst({
            where: { name },
            include: {
                nodes: true,
                edges: true,
                roadmap_topics: true
            }
        });

        let roadmap;

        if (existingRoadmap) {
            roadmap = await prisma.$transaction(async (tx) => {
                const updatedRoadmap = await tx.roadmap.update({
                    where: { id: existingRoadmap.id },
                    data: {
                        description
                    }
                });

                await tx.roadmapNode.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                const upsertedNodes = await Promise.all(
                    nodes.map((node) =>
                        tx.roadmapNode.upsert({
                            where: { id: node.id },
                            update: {
                                roadmap_id: existingRoadmap.id,
                                position_x: node.position.x,
                                position_y: node.position.y,
                                node_type: node.type,
                                label: node.data.label,
                                content: node.data.content || null,
                                level: node.data.level,
                                data: node
                            },
                            create: {
                                id: node.id,
                                roadmap_id: existingRoadmap.id,
                                position_x: node.position.x,
                                position_y: node.position.y,
                                node_type: node.type,
                                label: node.data.label,
                                content: node.data.content || null,
                                level: node.data.level,
                                data: node
                            }
                        })
                    )
                );

                await tx.roadmapEdge.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                const upsertedEdges = await Promise.all(
                    edges.map((edge) =>
                        tx.roadmapEdge.upsert({
                            where: { id: edge.id },
                            update: {
                                roadmap_id: existingRoadmap.id,
                                source_id: edge.source,
                                target_id: edge.target
                            },
                            create: {
                                id: edge.id,
                                roadmap_id: existingRoadmap.id,
                                source_id: edge.source,
                                target_id: edge.target
                            }
                        })
                    )
                );

                await tx.roadmapTopic.deleteMany({
                    where: { roadmap_id: existingRoadmap.id }
                });

                if (topicIds && topicIds.length > 0) {
                    await Promise.all(
                        topicIds.map((topicId) =>
                            tx.roadmapTopic.create({
                                data: {
                                    roadmap_id: existingRoadmap.id,
                                    topic_id: topicId
                                }
                            })
                        )
                    );
                }

                return {
                    roadmap: updatedRoadmap,
                    nodes: upsertedNodes,
                    edges: upsertedEdges
                };
            });
        } else {
            roadmap = await prisma.$transaction(async (tx) => {
                const newRoadmap = await tx.roadmap.create({
                    data: {
                        name,
                        description
                    }
                });

                const upsertedNodes = await Promise.all(
                    nodes.map((node) =>
                        tx.roadmapNode.upsert({
                            where: { id: node.id },
                            update: {
                                roadmap_id: newRoadmap.id,
                                position_x: node.position.x,
                                position_y: node.position.y,
                                node_type: node.type,
                                label: node.data.label,
                                content: node.data.content || null,
                                level: node.data.level,
                                data: node
                            },
                            create: {
                                id: node.id,
                                roadmap_id: newRoadmap.id,
                                position_x: node.position.x,
                                position_y: node.position.y,
                                node_type: node.type,
                                label: node.data.label,
                                content: node.data.content || null,
                                level: node.data.level,
                                data: node
                            }
                        })
                    )
                );

                const upsertedEdges = await Promise.all(
                    edges.map((edge) =>
                        tx.roadmapEdge.upsert({
                            where: { id: edge.id },
                            update: {
                                roadmap_id: newRoadmap.id,
                                source_id: edge.source,
                                target_id: edge.target
                            },
                            create: {
                                id: edge.id,
                                roadmap_id: newRoadmap.id,
                                source_id: edge.source,
                                target_id: edge.target
                            }
                        })
                    )
                );

                if (topicIds && topicIds.length > 0) {
                    await Promise.all(
                        topicIds.map((topicId) =>
                            tx.roadmapTopic.create({
                                data: {
                                    roadmap_id: newRoadmap.id,
                                    topic_id: topicId
                                }
                            })
                        )
                    );
                }

                return {
                    roadmap: newRoadmap,
                    nodes: upsertedNodes,
                    edges: upsertedEdges
                };
            });
        }

        return c.json({
            success: true,
            data: {
                id: roadmap.roadmap.id,
                name: roadmap.roadmap.name,
                description: roadmap.roadmap.description
            }
        });
    } catch (error) {
        console.error(error);
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
