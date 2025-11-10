import LoadingImage from '@/assets/lottie/loading.json';
import RoadmapFlow from '@/components/common/roadmap-flow';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import api from '@/utils/api';
import type { Edge, Node } from '@xyflow/react';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';

type Topic = {
    id: string;
    name: string;
};

type RoadmapNodeData = {
    id: string;
    roadmap_id: string;
    position_x: number;
    position_y: number;
    node_type: string;
    label: string;
    content?: string;
    level: 'REQUIRED' | 'OPTIONAL';
    data?: {
        data?: {
            level?: 'REQUIRED' | 'OPTIONAL';
        };
    };
};

type RoadmapEdgeData = {
    id: string;
    roadmap_id: string;
    source_id: string;
    target_id: string;
};

type Roadmap = {
    id: string;
    name: string;
    description: string;
    roadmap_topics: {
        topic: Topic;
    }[];
    _count: {
        nodes: number;
        user_paths: number;
    };
    nodes: RoadmapNodeData[];
    edges: RoadmapEdgeData[];
};

const RoadmapDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const fetchRoadmap = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${id}`);

            if (response.data.success) {
                const roadmapData = response.data.data;
                setRoadmap(roadmapData);

                const flowNodes = roadmapData.nodes.map((node: RoadmapNodeData): Node => {
                    const nodeData = node.data;
                    if (nodeData && typeof nodeData === 'object') {
                        const level = nodeData.data?.level || node.level || 'OPTIONAL';
                        return {
                            id: node.id,
                            type: node.node_type || 'default',
                            position: { x: node.position_x, y: node.position_y },
                            data: {
                                label: node.label,
                                content: node.content || '',
                                level: level
                            },
                            className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white!'
                        };
                    }

                    const level = node.level || 'OPTIONAL';
                    return {
                        id: node.id,
                        type: node.node_type || 'default',
                        position: { x: node.position_x, y: node.position_y },
                        data: {
                            label: node.label,
                            content: node.content || '',
                            level: level
                        },
                        className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white!'
                    };
                });

                const flowEdges = roadmapData.edges.map((edge: RoadmapEdgeData) => ({
                    id: edge.id,
                    source: edge.source_id,
                    target: edge.target_id,
                    type: 'smoothstep',
                    markerEnd: undefined
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } else {
                toast.error(response.data.error || MESSAGES.internalServerError);
                navigate('/roadmaps');
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
            navigate('/roadmaps');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, [id]);

    const handleBackToList = () => {
        navigate('/roadmaps');
    };

    if (loading) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                </div>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <div className='text-stone-500'>Không tìm thấy roadmap</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex w-full max-w-4xl flex-1 flex-col items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
            <RoadmapFlow name={roadmap.name} description={roadmap.description} topicIds={roadmap.roadmap_topics.map((t) => t.topic.id)} onSave={() => {}} onCancel={handleBackToList} roadmapId={roadmap.id} viewOnly={true} nodes={nodes} edges={edges} />
        </div>
    );
};

export default RoadmapDetail;
