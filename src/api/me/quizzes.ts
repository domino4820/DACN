import CONST from '@/config/const.js';
import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

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

const answerQuizSchema = z.object({
    selected_option_id: z.uuid()
});

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

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

app.get('/:id', async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.param();

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                topic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                options: true
            }
        });

        if (!quiz) {
            return c.json(
                {
                    success: false,
                    error: MESSAGES.quizNotFound
                },
                404
            );
        }

        const userAnswer = await prisma.quizAnswer.findFirst({
            where: {
                quiz_id: id,
                user_id: username
            },
            include: {
                selected_option: {
                    select: {
                        id: true,
                        content: true,
                        is_correct: true
                    }
                }
            }
        });

        const hasAnswered = !!userAnswer;

        const { correct_option_id, ...quizData } = quiz;

        const options = quiz.options.map((option) => {
            const { is_correct, ...optionData } = option;
            return {
                ...optionData,
                ...(hasAnswered ? { is_correct } : {})
            };
        });

        return c.json(
            {
                success: true,
                data: {
                    ...quizData,
                    options,
                    user_answer: userAnswer
                        ? {
                              selected_option_id: userAnswer.selected_option_id,
                              selected_option: userAnswer.selected_option,
                              is_correct: userAnswer.selected_option.is_correct,
                              created_at: userAnswer.created_at
                          }
                        : null
                }
            },
            200
        );
    } catch (error) {
        console.log('get quiz detail error:', error);
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.post('/:id/answer', zValidator('json', answerQuizSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.param();
        const { selected_option_id } = c.req.valid('json');

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                options: true
            }
        });

        if (!quiz) {
            return c.json(
                {
                    success: false,
                    error: MESSAGES.quizNotFound
                },
                404
            );
        }

        const option = quiz.options.find((opt) => opt.id === selected_option_id);
        if (!option) {
            return c.json(
                {
                    success: false,
                    error: MESSAGES.optionNotFound
                },
                400
            );
        }

        const existingAnswer = await prisma.quizAnswer.findFirst({
            where: {
                quiz_id: id,
                user_id: username
            }
        });

        if (existingAnswer) {
            return c.json(
                {
                    success: false,
                    error: MESSAGES.quizAlreadyAnswered
                },
                400
            );
        }

        const answer = await prisma.quizAnswer.create({
            data: {
                quiz_id: id,
                user_id: username,
                selected_option_id
            },
            include: {
                selected_option: {
                    select: {
                        id: true,
                        content: true,
                        is_correct: true
                    }
                },
                quiz: {
                    select: {
                        correct_option_id: true
                    }
                }
            }
        });

        const isCorrect = answer.selected_option.is_correct;

        if (isCorrect) {
            await prisma.userStats.upsert({
                where: { username },
                update: {
                    xp: {
                        increment: CONST.QUIZ_XP_REWARD
                    }
                },
                create: {
                    username,
                    xp: CONST.QUIZ_XP_REWARD
                }
            });
        }

        return c.json(
            {
                success: true,
                data: {
                    is_correct: isCorrect,
                    selected_option: answer.selected_option
                }
            },
            201
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return c.json(
                    {
                        success: false,
                        error: MESSAGES.quizAlreadyAnswered
                    },
                    400
                );
            }
        }

        console.log('answer quiz error:', error);
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
