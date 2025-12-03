import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import Textarea from '@/components/admin/ui/textarea';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import api from '@/utils/api';
import { faCircleNotch, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Topic = {
    id: string;
    name: string;
};

type QuizOption = {
    id: string;
    content: string;
    is_correct: boolean;
};

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

type QuizFormProps = {
    onClose: () => void;
    onSuccess?: () => void;
};

const QuizForm: FC<QuizFormProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        label: '',
        topic_id: '',
        content: '',
        options: [
            { id: uuidv4(), content: '', is_correct: false },
            { id: uuidv4(), content: '', is_correct: false },
            { id: uuidv4(), content: '', is_correct: false },
            { id: uuidv4(), content: '', is_correct: false }
        ] as QuizOption[]
    });
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');

    const fetchTopics = async () => {
        try {
            const response = await api.get<ApiResponse<Topic[]>>(apiEndpoints.public.topics);
            setTopics(response.data.data);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const updateOption = (optionId: string, field: keyof QuizOption, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            options: prev.options.map((opt) => (opt.id === optionId ? { ...opt, [field]: value } : field === 'is_correct' && value === true ? { ...opt, is_correct: false } : opt))
        }));
    };

    const handleGenerateQuiz = async () => {
        if (!formData.topic_id) {
            setError('Vui lòng chọn topic trước khi generate');
            return;
        }

        try {
            setGenerating(true);
            setError(null);

            const payload: { topic_id: string; prompt?: string } = {
                topic_id: formData.topic_id
            };

            if (prompt.trim()) {
                payload.prompt = prompt.trim();
            }

            const response = await api.post<ApiResponse<{ label: string; content: string; topic_id: string; options: Array<{ id: string; content: string; is_correct: boolean }> }>>(apiEndpoints.admin.genQuizz, payload);

            const { label, content, options } = response.data.data;

            setFormData((prev) => ({
                ...prev,
                label,
                content,
                options: options.map((opt) => ({
                    id: opt.id || uuidv4(),
                    content: opt.content,
                    is_correct: opt.is_correct
                }))
            }));

            setPrompt('');
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.label.trim()) {
            setError('Vui lòng nhập tên quiz');
            return;
        }

        if (!formData.topic_id) {
            setError('Vui lòng chọn topic');
            return;
        }

        if (!formData.content.trim()) {
            setError('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        if (formData.options.length !== 4) {
            setError('Quiz phải có đúng 4 đáp án');
            return;
        }

        const correctOptionCount = formData.options.filter((opt) => opt.is_correct).length;
        if (correctOptionCount !== 1) {
            setError('Phải có đúng 1 đáp án đúng');
            return;
        }

        for (const option of formData.options) {
            if (!option.content.trim()) {
                setError('Tất cả đáp án phải có nội dung');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);
            const payload = {
                label: formData.label.trim(),
                topic_id: formData.topic_id,
                content: formData.content.trim(),
                options: formData.options.map((opt) => ({
                    id: opt.id,
                    content: opt.content.trim(),
                    is_correct: opt.is_correct
                }))
            };

            await api.post<ApiResponse<unknown>>(apiEndpoints.admin.quizzes, payload);
            onSuccess?.();
            onClose();
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <p className='mb-4 text-lg font-semibold'>Tạo Quiz mới</p>

            {error && <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <form onSubmit={handleSubmit} className='space-y-6'>
                <div>
                    <label htmlFor='quiz-label' className='block text-sm font-bold text-gray-700'>
                        Tên Quiz *
                    </label>
                    <Input id='quiz-label' type='text' value={formData.label} onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))} placeholder='(VD: SQL vs NoSQL)' required maxLength={200} disabled={loading || generating} />
                </div>

                <div>
                    <label htmlFor='quiz-content' className='block text-sm font-bold text-gray-700'>
                        Nội dung câu hỏi *
                    </label>
                    <Textarea id='quiz-content' value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} placeholder='(VD: Điểm khác nhau chính về khả năng mở rộng (scaling) giữa SQL và NoSQL là gì?)' rows={3} required disabled={loading || generating} />
                </div>

                <div>
                    <label htmlFor='quiz-topic' className='block text-sm font-bold text-gray-700'>
                        Topic *
                    </label>
                    <div className='flex items-end gap-2'>
                        <Dropdown trigger={topics.find((t) => t.id === formData.topic_id)?.name || 'Chọn topic'} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[150px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in' menuClassName='w-[150px]'>
                            {topics.map((topic) => (
                                <DropdownItem key={topic.id} onClick={() => setFormData((prev) => ({ ...prev, topic_id: topic.id }))}>
                                    {topic.name}
                                </DropdownItem>
                            ))}
                        </Dropdown>
                        {formData.topic_id && (
                            <Button type='button' onClick={handleGenerateQuiz} disabled={generating || loading} className='h-9 w-9 rounded-md bg-transparent p-0 text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700' title='Generate Quiz'>
                                {generating ? <FontAwesomeIcon icon={faCircleNotch} className='animate-spin' /> : <FontAwesomeIcon icon={faWandMagicSparkles} />}
                            </Button>
                        )}
                    </div>
                </div>

                {formData.topic_id && (
                    <div>
                        <label htmlFor='quiz-prompt' className='block text-sm font-medium text-gray-700'>
                            Yêu cầu cụ thể (tùy chọn)
                        </label>
                        <Textarea id='quiz-prompt' value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='(VD: Tập trung vào khái niệm cơ bản, hoặc về performance, hoặc về best practices...)' rows={2} disabled={generating || loading} />
                    </div>
                )}

                <div>
                    <div className='block text-sm font-bold text-gray-700'>Đáp án *</div>
                    <div className='space-y-2'>
                        {formData.options.map((option, oIndex) => (
                            <div key={option.id} className='flex items-center gap-2'>
                                <input type='checkbox' checked={option.is_correct} onChange={(e) => updateOption(option.id, 'is_correct', e.target.checked)} className='h-4 w-4 cursor-pointer rounded border-gray-300 accent-stone-600' disabled={loading || generating} tabIndex={-1} />
                                <Input value={option.content} onChange={(e) => updateOption(option.id, 'content', e.target.value)} placeholder={`Đáp án ${oIndex + 1}`} className='flex-1' required disabled={loading || generating} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className='flex justify-end gap-2'>
                    <Button type='button' onClick={onClose} className='bg-transparent text-stone-800 hover:bg-stone-100' disabled={loading || generating}>
                        Hủy
                    </Button>
                    <Button type='submit' disabled={loading || generating}>
                        Tạo Quiz
                    </Button>
                </div>
            </form>
        </>
    );
};

export default QuizForm;
