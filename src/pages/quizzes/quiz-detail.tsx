import LoadingImage from '@/assets/lottie/loading.json';
import Button from '@/components/ui/button';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faArrowLeft, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';

type QuizOption = {
    id: string;
    content: string;
    is_correct?: boolean;
};

type UserAnswer = {
    selected_option_id: string;
    selected_option: {
        id: string;
        content: string;
        is_correct: boolean;
    };
    is_correct: boolean;
    created_at: string;
};

type Quiz = {
    id: string;
    label: string;
    content: string;
    topic: {
        id: string;
        name: string;
    };
    options: QuizOption[];
    user_answer: UserAnswer | null;
};

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

const QuizDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { setFullUser } = useAuthStore();
    const loadingRef = useRef<HTMLDivElement>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ is_correct: boolean; selected_option: QuizOption } | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [height, setHeight] = useState<number>(0);

    const fetchQuiz = async (showLoading = true) => {
        if (!id) return;

        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await api.get<ApiResponse<Quiz>>(`${apiEndpoints.me.quizzes}/${id}`);

            if (response.data.success) {
                const quizData = response.data.data;
                setQuiz(quizData);

                if (quizData.user_answer) {
                    setHasAnswered(true);
                    setAnswerResult({
                        is_correct: quizData.user_answer.is_correct,
                        selected_option: quizData.user_answer.selected_option
                    });
                }
            } else {
                toast.error(response.data.error || MESSAGES.internalServerError);
                navigate(paths.quizzes);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
            if (showLoading) {
                navigate(paths.quizzes);
            }
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        if (loadingRef.current) {
            setHeight(loadingRef.current.clientHeight);
        }
    }, [loadingRef.current]);

    const handleSubmitAnswer = async () => {
        if (!selectedOptionId || !id) return;

        try {
            setSubmitting(true);
            const response = await api.post<ApiResponse<{ is_correct: boolean; selected_option: QuizOption }>>(`${apiEndpoints.me.quizzes}/${id}/answer`, {
                selected_option_id: selectedOptionId
            });

            if (response.data.success) {
                setAnswerResult(response.data.data);
                setHasAnswered(true);

                if (response.data.data.is_correct) {
                    try {
                        const profileResponse = await api.get(apiEndpoints.me.getProfile);
                        if (profileResponse.data.success && profileResponse.data.data) {
                            setFullUser(profileResponse.data.data);
                            const newXp = profileResponse.data.data.stats?.xp || 0;
                            toast.success(`${newXp} XP`);
                        }
                    } catch {
                        //
                    }
                }

                await fetchQuiz(false);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
                if (errorMsg === MESSAGES.quizAlreadyAnswered) {
                    setHasAnswered(true);
                }
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToList = () => {
        navigate(paths.quizzes);
    };

    if (loading) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800' ref={loadingRef}>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <div className='text-stone-500'>{MESSAGES.quizNotFound}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className='flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'
            style={{
                height: height,
                maxHeight: height
            }}
        >
            <div className='mb-4 flex w-full shrink-0 items-center justify-between'>
                <Button variant='outline' onClick={handleBackToList} className='flex items-center gap-2'>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại</span>
                </Button>
                <div className='rounded-lg bg-stone-100 px-3 py-1 text-sm text-stone-600 dark:bg-stone-700 dark:text-stone-400'>{quiz.topic.name}</div>
            </div>

            <div className='w-full flex-1 space-y-6 overflow-y-auto'>
                <div>
                    <p className='text-2xl font-bold text-stone-900 dark:text-stone-100'>{quiz.label}</p>
                </div>

                <div className='rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900'>
                    <p className='text-lg whitespace-pre-wrap text-stone-800 dark:text-stone-200'>{quiz.content}</p>
                </div>

                {hasAnswered ? (
                    <div className='space-y-3'>
                        {quiz.options.map((option) => {
                            const isSelected = answerResult?.selected_option.id === option.id;
                            const isCorrect = option.is_correct ?? false;

                            return (
                                <div key={option.id} className={`w-full rounded-lg border-2 p-4 ${isCorrect ? 'border-stone-600 bg-stone-100 dark:border-stone-400 dark:bg-stone-800' : isSelected ? 'border-stone-400 bg-stone-50 dark:border-stone-600 dark:bg-stone-900' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800'}`}>
                                    <div className='flex items-center justify-between'>
                                        <p className={`${isCorrect || isSelected ? 'font-medium' : ''} text-stone-900 dark:text-stone-100`}>{option.content}</p>
                                        {isCorrect && <FontAwesomeIcon icon={faCheckCircle} className='text-stone-700 dark:text-stone-300' />}
                                        {isSelected && !isCorrect && <FontAwesomeIcon icon={faTimesCircle} className='text-stone-600 dark:text-stone-400' />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        <div className='space-y-3'>
                            {quiz.options.map((option) => (
                                <button key={option.id} onClick={() => setSelectedOptionId(option.id)} className={`w-full rounded-lg border-2 p-4 text-left transition-all ${selectedOptionId === option.id ? 'border-stone-800 bg-stone-100 dark:border-stone-300 dark:bg-stone-700' : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600'}`}>
                                    <p className='text-stone-900 dark:text-stone-100'>{option.content}</p>
                                </button>
                            ))}
                        </div>

                        <div className='flex justify-end'>
                            <Button onClick={handleSubmitAnswer} disabled={!selectedOptionId || submitting}>
                                {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuizDetail;
