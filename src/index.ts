import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import 'dotenv/config';
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { Server } from 'socket.io';

import adminApi from '@/api/admin/index.js';
import meApi from '@/api/me/index.js';
import publicApi from '@/api/public/index.js';
import MESSAGES from '@/config/message.js';
import socketEvent from '@/config/socket-event.js';
import { adminMiddleware } from '@/middleware/admin.js';
import { authMiddleware } from '@/middleware/auth.js';
import prisma from '@/utils/prisma.js';

const app = new Hono();

app.use('/uploads/*', serveStatic({ root: './' }));

const api = new Hono().basePath('/api');

api.use('/admin/*', adminMiddleware);
api.route('/admin', adminApi);

api.use('/me/*', authMiddleware);
api.route('/me', meApi);

api.route('/', publicApi);
app.route('/', api);

const io = new Server();
const jwtSecret = process.env.JWT_SECRET || '';

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('no token'));
    }

    try {
        const payload = await verify(token, jwtSecret);
        if (!payload?.sub) {
            return next(new Error('invalid token'));
        }

        socket.data.username = payload.sub as string;
        return next();
    } catch {
        return next(new Error('invalid token'));
    }
});

io.on('connection', (socket) => {
    const username = socket.data.username as string;
    console.log(`Client connected: ${socket.id} (${username})`);

    socket.on(socketEvent.JOIN_GROUP, async (payload) => {
        if (!payload || typeof payload !== 'object') {
            return socket.emit(socketEvent.ERROR, 'payload invalid');
        }

        const { groupId } = payload as { groupId?: string };
        if (!groupId || typeof groupId !== 'string') {
            return socket.emit(socketEvent.ERROR, 'groupId invalid');
        }

        try {
            const membership = await prisma.groupMember.findUnique({
                where: {
                    group_id_user_id: {
                        group_id: groupId,
                        user_id: username
                    }
                },
                select: { group_id: true }
            });

            if (!membership) {
                return socket.emit(socketEvent.ERROR, MESSAGES.groupNotMember);
            }

            socket.join(groupId);
            return;
        } catch (error) {
            console.log(`join group fail ${username}`, error);
            return socket.emit(socketEvent.ERROR, MESSAGES.internalServerError);
        }
    });

    socket.on(socketEvent.SEND_GROUP_MESSAGE, async (payload) => {
        if (!payload || typeof payload !== 'object') {
            return socket.emit(socketEvent.ERROR, 'payload invalid');
        }

        const { groupId, content } = payload as { groupId?: string; content?: string };
        if (!groupId || typeof groupId !== 'string') {
            return socket.emit(socketEvent.ERROR, 'groupId invalid');
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return socket.emit(socketEvent.ERROR, 'content invalid');
        }

        try {
            const membership = await prisma.groupMember.findUnique({
                where: {
                    group_id_user_id: {
                        group_id: groupId,
                        user_id: username
                    }
                },
                select: { group_id: true }
            });

            if (!membership) {
                return socket.emit(socketEvent.ERROR, MESSAGES.groupNotMember);
            }

            socket.join(groupId);

            const message = await prisma.groupMessage.create({
                data: {
                    group_id: groupId,
                    user_id: username,
                    content: content.trim()
                },
                include: {
                    user: {
                        select: {
                            username: true,
                            profile: {
                                select: {
                                    name: true,
                                    avatar_url: true
                                }
                            }
                        }
                    }
                }
            });

            const messageUser = message.user;
            const messagePayload = {
                id: message.id,
                groupId: message.group_id,
                content: message.content,
                createdAt: message.created_at,
                user: {
                    username: messageUser.username,
                    name: messageUser.profile?.name ?? null,
                    avatarUrl: messageUser.profile?.avatar_url ?? null
                }
            };

            io.to(groupId).emit(socketEvent.GROUP_MESSAGE_RECEIVED, messagePayload);
            return;
        } catch (error) {
            console.log(`send msg fail ${username}`, error);
            return socket.emit(socketEvent.ERROR, MESSAGES.internalServerError);
        }
    });

    socket.on(socketEvent.SEND_GROUP_MESSAGE_REPLY, async (payload) => {
        if (!payload || typeof payload !== 'object') {
            return socket.emit(socketEvent.ERROR, 'payload invalid');
        }

        const { replyToMessageId, content } = payload as { replyToMessageId?: string; content?: string };
        if (!replyToMessageId || typeof replyToMessageId !== 'string') {
            return socket.emit(socketEvent.ERROR, 'replyToMessageId invalid');
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return socket.emit(socketEvent.ERROR, 'content invalid');
        }

        try {
            const parentMessage = await prisma.groupMessage.findUnique({
                where: { id: replyToMessageId },
                select: { id: true, group_id: true }
            });

            if (!parentMessage) {
                return socket.emit(socketEvent.ERROR, 'message not found');
            }

            const membership = await prisma.groupMember.findUnique({
                where: {
                    group_id_user_id: {
                        group_id: parentMessage.group_id,
                        user_id: username
                    }
                },
                select: { group_id: true }
            });

            if (!membership) {
                return socket.emit(socketEvent.ERROR, MESSAGES.groupNotMember);
            }

            socket.join(parentMessage.group_id);

            const message = await prisma.groupMessage.create({
                data: {
                    group_id: parentMessage.group_id,
                    reply_to_message_id: replyToMessageId,
                    user_id: username,
                    content: content.trim()
                },
                include: {
                    user: {
                        select: {
                            username: true,
                            profile: {
                                select: {
                                    name: true,
                                    avatar_url: true
                                }
                            }
                        }
                    }
                }
            });

            const messageUser = message.user;
            const messagePayload = {
                id: message.id,
                groupId: message.group_id,
                replyToMessageId: message.reply_to_message_id,
                content: message.content,
                createdAt: message.created_at,
                user: {
                    username: messageUser.username,
                    name: messageUser.profile?.name ?? null,
                    avatarUrl: messageUser.profile?.avatar_url ?? null
                }
            };

            io.to(parentMessage.group_id).emit(socketEvent.GROUP_MESSAGE_RECEIVED, messagePayload);
            return;
        } catch (error) {
            console.log(`reply msg fail ${username}`, error);
            return socket.emit(socketEvent.ERROR, MESSAGES.internalServerError);
        }
    });

    socket.on(socketEvent.ERROR, (message) => {
        console.log(`socket error ${socket.id}: ${message}`);
    });
});

const server = serve(
    {
        fetch: app.fetch,
        port: 3000
    },
    (info) => {
        console.log(`server is running on http://localhost:${info.port}`);
    }
);

io.attach(server);
