import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import Textarea from '@/components/admin/ui/textarea';
import RoadmapFlow from '@/components/common/roadmap-flow';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import apiEndpoints from '@/config/api-endpoints';
import api from '@/utils/api';
import { isAxiosError } from 'axios';
import type { ChangeEvent, FC } from 'react';
import { useEffect, useState } from 'react';

type Topic = {
    id: string;
    name: string;
};

type RoadmapTopic = {
    topic: Topic;
};

type RoadmapFormProps = {
    onClose: () => void;
    onSuccess?: () => void;
    roadmapId?: string;
};

type FormData = {
    name: string;
    description: string;
    topicIds: string[];
};

const RoadmapForm: FC<RoadmapFormProps> = ({ onClose, onSuccess, roadmapId }) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        topicIds: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFlow, setShowFlow] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const isEditing = !!roadmapId;

    const fetchTopics = async () => {
        try {
            const response = await api.get(apiEndpoints.public.topics);
            setTopics(response.data.data);
        } catch {
            setError('Load topic lỗi!');
        }
    };

    const fetchRoadmap = async () => {
        if (!roadmapId) return;

        try {
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${roadmapId}`);

            if (response.data.success) {
                const roadmap = response.data.data;
                setFormData({
                    name: roadmap.name,
                    description: roadmap.description || '',
                    topicIds: roadmap.roadmap_topics.map((rt: RoadmapTopic) => rt.topic.id)
                });
            } else {
                setError(response.data.error || 'Load roadmap lỗi!');
            }
        } catch {
            setError('Load roadmap lỗi!');
        }
    };

    useEffect(() => {
        fetchTopics();
        if (roadmapId) {
            fetchRoadmap();
        }
    }, [roadmapId]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTopicSelect = (topicId: string) => {
        setFormData((prev) => ({
            ...prev,
            topicIds: prev.topicIds.includes(topicId) ? prev.topicIds.filter((id) => id !== topicId) : [...prev.topicIds, topicId]
        }));
    };

    const handleContinue = () => {
        if (!formData.name.trim()) {
            setError('Tên roadmap không được để trống');
            return;
        }
        setShowFlow(true);
    };

    const handleSaveRoadmap = async (roadmapData: unknown) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.put(apiEndpoints.admin.roadmap, roadmapData);

            if (response.data.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(response.data.error || 'Save roadmap lỗi!');
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || 'Save roadmap lỗi!');
            } else {
                setError('Save roadmap lỗi!');
            }
        } finally {
            setLoading(false);
        }
    };

    if (showFlow) {
        return <RoadmapFlow name={formData.name} description={formData.description} topicIds={formData.topicIds} onSave={handleSaveRoadmap} onCancel={onClose} roadmapId={roadmapId} />;
    }

    return (
        <div className='mb-4 shrink-0 rounded-md bg-white p-4 shadow'>
            <p className='mb-4 text-lg font-semibold'>{isEditing ? 'Chỉnh sửa Roadmap' : 'Tạo Roadmap mới'}</p>

            {error && <div className='mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <div className='space-y-4'>
                <div>
                    <label htmlFor='roadmap-name' className='mb-2 block text-sm font-bold text-gray-700'>
                        Tên Roadmap
                    </label>
                    <Input id='roadmap-name' name='name' value={formData.name} onChange={handleInputChange} placeholder='Nhập tên roadmap' disabled={loading} />
                </div>
                <div>
                    <label htmlFor='roadmap-description' className='mb-2 block text-sm font-bold text-gray-700'>
                        Mô tả
                    </label>
                    <Textarea id='roadmap-description' name='description' value={formData.description} onChange={handleInputChange} placeholder='Nhập mô tả cho roadmap' rows={3} disabled={loading} />
                </div>
                <div>
                    <label htmlFor='topic-select' className='mb-2 block text-sm font-bold text-gray-700'>
                        Topic
                    </label>
                    <div className='space-y-2'>
                        <Dropdown trigger='Chọn topic' triggerVariant='outline' triggerClassName='w-full' menuClassName='w-full'>
                            {topics.map((topic) => (
                                <DropdownItem key={topic.id} onClick={() => handleTopicSelect(topic.id)}>
                                    <div className='max-w-[200px] truncate'>{topic.name}</div>
                                </DropdownItem>
                            ))}
                        </Dropdown>
                        {formData.topicIds.length > 0 && (
                            <div className='mt-2 flex flex-wrap gap-2'>
                                {formData.topicIds.map((topicId) => {
                                    const topic = topics.find((t) => t.id === topicId);
                                    return topic ? (
                                        <span key={topicId} className='inline-block max-w-[150px] truncate rounded bg-gray-100 px-2 py-1 text-xs'>
                                            {topic.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className='flex justify-end'>
                    <Button type='button' className='mr-2 bg-transparent text-stone-800 hover:bg-stone-100' onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={handleContinue} disabled={loading}>
                        Tiếp tục
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RoadmapForm;
