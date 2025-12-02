import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const roadmapIdParamSchema = z.object({
    id: z.uuid()
});

const commentIdParamSchema = z.object({
    id: z.uuid()
});

const nodeIdParamSchema = z.object({
    roadmapId: z.uuid(),
    nodeId: z.uuid()
});

const createCommentSchema = z.object({
    content: z.string().min(1).max(1000)
});

const querySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 1)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 10))
});

const commentUserSelect = {
    username: true,
    profile: {
        select: {
            name: true,
            avatar_url: true
        }
    }
} satisfies Prisma.UserSelect;

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.post('/:id/comments', zValidator('param', roadmapIdParamSchema), zValidator('json', createCommentSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { content } = c.req.valid('json');

        const roadmap = await prisma.roadmap.findUnique({
            where: { id }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const comment = await prisma.roadmapComment.create({
            data: {
                roadmap_id: id,
                user_id: username,
                content: content.trim()
            },
            include: {
                user: {
                    select: commentUserSelect
                }
            }
        });

        return c.json(
            {
                success: true,
                data: {
                    id: comment.id,
                    roadmapId: comment.roadmap_id,
                    content: comment.content,
                    createdAt: comment.created_at,
                    user: {
                        username: comment.user.username,
                        name: comment.user.profile?.name ?? null,
                        avatarUrl: comment.user.profile?.avatar_url ?? null
                    }
                }
            },
            201
        );
    } catch (error) {
        console.log('create roadmap comment error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id/comments', zValidator('param', roadmapIdParamSchema), zValidator('query', querySchema), async (c) => {
    try {
        const { id } = c.req.valid('param');
        const { page, limit } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const roadmap = await prisma.roadmap.findUnique({
            where: { id }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const totalCount = await prisma.roadmapComment.count({
            where: { roadmap_id: id }
        });

        const comments = await prisma.roadmapComment.findMany({
            where: { roadmap_id: id },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: commentUserSelect
                }
            }
        });

        const items = comments.map((comment) => ({
            id: comment.id,
            roadmapId: comment.roadmap_id,
            content: comment.content,
            createdAt: comment.created_at,
            user: {
                username: comment.user.username,
                name: comment.user.profile?.name ?? null,
                avatarUrl: comment.user.profile?.avatar_url ?? null
            }
        }));

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json(
            {
                success: true,
                data: items,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            },
            200
        );
    } catch (error) {
        console.log('get roadmap comments error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.delete('/comments/:id', zValidator('param', commentIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const comment = await prisma.roadmapComment.findUnique({
            where: { id },
            select: {
                user_id: true
            }
        });

        if (!comment) {
            return c.json({ success: true }, 200);
        }

        if (comment.user_id !== username) {
            return c.json({ success: false, error: 'Không có quyền xóa comment này' }, 403);
        }

        await prisma.roadmapComment.delete({
            where: { id }
        });

        return c.json({ success: true }, 200);
    } catch (error) {
        console.log('delete roadmap comment error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:roadmapId/nodes/:nodeId/learning', zValidator('param', nodeIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { roadmapId, nodeId } = c.req.valid('param');

        const roadmap = await prisma.roadmap.findUnique({
            where: { id: roadmapId }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const node = await prisma.roadmapNode.findUnique({
            where: { id: nodeId },
            select: { roadmap_id: true }
        });

        if (!node) {
            return c.json({ success: false, error: 'Node không tồn tại' }, 404);
        }

        if (node.roadmap_id !== roadmapId) {
            return c.json({ success: false, error: 'Node không thuộc roadmap này' }, 400);
        }

        const path = await prisma.userPath.upsert({
            where: {
                user_id_roadmap_id: {
                    user_id: username,
                    roadmap_id: roadmapId
                }
            },
            update: {
                current_node_id: nodeId
            },
            create: {
                user_id: username,
                roadmap_id: roadmapId,
                current_node_id: nodeId
            }
        });

        return c.json(
            {
                success: true,
                data: {
                    roadmapId: path.roadmap_id,
                    currentNodeId: path.current_node_id
                }
            },
            200
        );
    } catch (error) {
        console.log('check learning node error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        const username = c.get('username');
        const { page, limit } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const totalCount = await prisma.userPath.count({
            where: { user_id: username }
        });

        const paths = await prisma.userPath.findMany({
            where: { user_id: username },
            skip,
            take: limit,
            include: {
                roadmap: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            },
            orderBy: {
                roadmap: {
                    name: 'asc'
                }
            }
        });

        const currentNodeIds = paths.filter((p) => p.current_node_id).map((p) => p.current_node_id!);
        const currentNodes =
            currentNodeIds.length > 0
                ? await prisma.roadmapNode.findMany({
                      where: { id: { in: currentNodeIds } },
                      select: { id: true, label: true }
                  })
                : [];
        const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

        const items = paths.map((path) => ({
            roadmapId: path.roadmap_id,
            roadmap: path.roadmap,
            currentNodeId: path.current_node_id,
            currentNode: path.current_node_id ? (nodeMap.get(path.current_node_id) ?? null) : null
        }));

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json(
            {
                success: true,
                data: items,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            },
            200
        );
    } catch (error) {
        console.log('get user paths error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id/path', zValidator('param', roadmapIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const roadmap = await prisma.roadmap.findUnique({
            where: { id }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const path = await prisma.userPath.findUnique({
            where: {
                user_id_roadmap_id: {
                    user_id: username,
                    roadmap_id: id
                }
            }
        });

        const currentNode = path?.current_node_id
            ? await prisma.roadmapNode.findUnique({
                  where: { id: path.current_node_id },
                  select: { id: true, label: true, content: true }
              })
            : null;

        if (!path) {
            return c.json(
                {
                    success: true,
                    data: {
                        roadmapId: id,
                        currentNodeId: null,
                        currentNode: null,
                        isStarted: false
                    }
                },
                200
            );
        }

        const allCompletedNodes = await prisma.userNodeCompletion.findMany({
            where: { user_id: username },
            select: { node_id: true }
        });
        const completedNodeIds = allCompletedNodes.map((c) => c.node_id);
        const nodesInRoadmap = await prisma.roadmapNode.findMany({
            where: {
                id: { in: completedNodeIds },
                roadmap_id: id
            }
        });
        const completedNodesCount = nodesInRoadmap.length;

        const totalNodesCount = await prisma.roadmapNode.count({
            where: { roadmap_id: id }
        });

        return c.json(
            {
                success: true,
                data: {
                    roadmapId: path.roadmap_id,
                    currentNodeId: path.current_node_id,
                    currentNode: currentNode,
                    isStarted: true,
                    progress: {
                        completed: completedNodesCount,
                        total: totalNodesCount,
                        percentage: totalNodesCount > 0 ? Math.round((completedNodesCount / totalNodesCount) * 100) : 0
                    }
                }
            },
            200
        );
    } catch (error) {
        console.log('get roadmap path error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:roadmapId/nodes/:nodeId/complete', zValidator('param', nodeIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { roadmapId, nodeId } = c.req.valid('param');

        const roadmap = await prisma.roadmap.findUnique({
            where: { id: roadmapId }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const node = await prisma.roadmapNode.findUnique({
            where: { id: nodeId },
            select: { roadmap_id: true }
        });

        if (!node) {
            return c.json({ success: false, error: 'Node không tồn tại' }, 404);
        }

        if (node.roadmap_id !== roadmapId) {
            return c.json({ success: false, error: 'Node không thuộc roadmap này' }, 400);
        }

        const path = await prisma.userPath.findUnique({
            where: {
                user_id_roadmap_id: {
                    user_id: username,
                    roadmap_id: roadmapId
                }
            }
        });

        const existingCompletion = await prisma.userNodeCompletion.findFirst({
            where: {
                user_id: username,
                roadmap_id: roadmapId,
                node_id: nodeId
            }
        });

        let completion;
        if (existingCompletion) {
            completion = existingCompletion;
        } else {
            completion = await prisma.userNodeCompletion.create({
                data: {
                    user_id: username,
                    roadmap_id: roadmapId,
                    node_id: nodeId
                }
            });
        }

        if (path?.current_node_id === nodeId) {
            await prisma.userPath.update({
                where: {
                    user_id_roadmap_id: {
                        user_id: username,
                        roadmap_id: roadmapId
                    }
                },
                data: {
                    current_node_id: null
                }
            });
        }

        const nodeInfo = await prisma.roadmapNode.findUnique({
            where: { id: nodeId },
            select: { id: true, label: true }
        });

        return c.json(
            {
                success: true,
                data: {
                    nodeId: completion.node_id,
                    node: nodeInfo,
                    completedAt: completion.completed_at
                }
            },
            201
        );
    } catch (error) {
        console.log('complete node error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id/completed-nodes', zValidator('param', roadmapIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const roadmap = await prisma.roadmap.findUnique({
            where: { id }
        });

        if (!roadmap) {
            return c.json({ success: false, error: 'Roadmap không tồn tại' }, 404);
        }

        const allCompletedNodes = await prisma.userNodeCompletion.findMany({
            where: { user_id: username },
            orderBy: {
                completed_at: 'desc'
            }
        });

        const nodeIds = allCompletedNodes.map((c) => c.node_id);
        const nodes =
            nodeIds.length > 0
                ? await prisma.roadmapNode.findMany({
                      where: {
                          id: { in: nodeIds },
                          roadmap_id: id
                      },
                      select: { id: true, label: true, content: true, level: true }
                  })
                : [];
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const validNodeIds = new Set(nodes.map((n) => n.id));

        const items = allCompletedNodes
            .filter((completion) => validNodeIds.has(completion.node_id))
            .map((completion) => ({
                nodeId: completion.node_id,
                node: nodeMap.get(completion.node_id) ?? null,
                completedAt: completion.completed_at
            }));

        return c.json(
            {
                success: true,
                data: items
            },
            200
        );
    } catch (error) {
        console.log('get completed nodes error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
