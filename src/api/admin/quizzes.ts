import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const optionSchema = z.object({
    id: z.string(),
    content: z.string().min(1),
    is_correct: z.boolean()
});

const createQuizSchema = z.object({
    label: z.string().min(1).max(200),
    topic_id: z.uuid(),
    content: z.string().min(1),
    options: z.array(optionSchema).length(4)
});

const querySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 1)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 10)),
    topic_id: z.uuid().optional()
});

const app = new Hono();

app.post('/', zValidator('json', createQuizSchema), async (c) => {
    try {
        const { label, topic_id, content, options } = c.req.valid('json');

        const topic = await prisma.topic.findUnique({
            where: { id: topic_id }
        });

        if (!topic) {
            return c.json(
                {
                    success: false,
                    error: 'Topic không tồn tại'
                },
                404
            );
        }

        const correctOptionCount = options.filter((opt) => opt.is_correct).length;
        if (correctOptionCount !== 1) {
            return c.json(
                {
                    success: false,
                    error: 'Phải có đúng 1 đáp án đúng'
                },
                400
            );
        }

        const quiz = await prisma.$transaction(async (tx) => {
            const newQuiz = await tx.quiz.create({
                data: {
                    label,
                    content,
                    topic_id
                }
            });

            const createdOptions = await Promise.all(
                options.map((option) =>
                    tx.quizOption.create({
                        data: {
                            id: option.id,
                            quiz_id: newQuiz.id,
                            content: option.content,
                            is_correct: option.is_correct
                        }
                    })
                )
            );

            const correctOptionId = createdOptions.find((opt) => opt.is_correct)?.id;

            if (correctOptionId) {
                await tx.quiz.update({
                    where: { id: newQuiz.id },
                    data: {
                        correct_option_id: correctOptionId
                    }
                });
            }

            return await tx.quiz.findUnique({
                where: { id: newQuiz.id },
                include: {
                    topic: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    options: true,
                    correct_option: {
                        select: {
                            id: true
                        }
                    },
                    _count: {
                        select: {
                            answers: true
                        }
                    }
                }
            });
        });

        return c.json(
            {
                success: true,
                data: quiz
            },
            201
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return c.json(
                    {
                        success: false,
                        error: MESSAGES.nameExists
                    },
                    409
                );
            }
        }

        if (error instanceof Error) {
            return c.json(
                {
                    success: false,
                    error: error.message
                },
                400
            );
        }

        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        const { page, limit, topic_id } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const where: Prisma.QuizWhereInput = {};

        if (topic_id) {
            where.topic_id = topic_id;
        }

        const totalCount = await prisma.quiz.count({ where });

        const quizzes = await prisma.quiz.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                id: 'desc'
            },
            include: {
                topic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        answers: true
                    }
                }
            }
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json(
            {
                success: true,
                data: quizzes,
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
        console.log('get quizzes list error:', error);
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

        const quiz = await prisma.quiz.findUnique({
            where: { id }
        });

        if (!quiz) {
            return c.json({ success: true }, 200);
        }

        await prisma.quiz.delete({
            where: { id }
        });

        return c.json({ success: true }, 200);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: true }, 200);
            }
        }

        console.log('delete quiz error:', error);
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
