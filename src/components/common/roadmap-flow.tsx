import CompletedImage from '@/assets/lottie/completed.json';
import LearningImage from '@/assets/lottie/learning.json';
import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import Textarea from '@/components/admin/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faBookOpen, faCheck, faCircleNotch, faTimes, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { addEdge, Background, Handle, Position, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, type Connection, type Edge, type Node, type NodeProps, type OnConnectEnd } from '@xyflow/react';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

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

type RoadmapData = {
    id: string;
    name: string;
    description?: string;
    nodes: RoadmapNodeData[];
    edges: RoadmapEdgeData[];
};

type UserProgress = {
    currentNodeId: string | null;
    currentNode: {
        id: string;
        label: string;
    } | null;
    completedNodeIds: string[];
    progress: {
        completed: number;
        total: number;
        percentage: number;
    };
};

type CustomRoadmapNodeData = {
    label: string;
    content?: string;
    level: 'REQUIRED' | 'OPTIONAL';
    deletable: boolean;
    isLearning?: boolean;
    isCompleted?: boolean;
};

type RoadmapFlowProps = {
    name: string;
    description: string | null;
    topicIds: string[];
    onSave: (data: { name: string; description: string; topicIds: string[]; nodes: Node[]; edges: Edge[] }) => void;
    onCancel: () => void;
    roadmapId?: string;
    viewOnly?: boolean;
    nodes?: Node[];
    edges?: Edge[];
    headerActions?: ReactNode;
    userProgress?: UserProgress;
    onNodeStatusChange?: () => void;
    onDescriptionChange?: (description: string) => void;
};

const RoadmapFlow: FC<RoadmapFlowProps> = ({ name, description, topicIds, onSave, onCancel, roadmapId, viewOnly = false, nodes: initialNodes, edges: initialEdges, headerActions, userProgress, onNodeStatusChange, onDescriptionChange }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
    const { toObject, screenToFlowPosition } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isEditingNode, setIsEditingNode] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generateLoading, setGenerateLoading] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const fetchRoadmapData = async () => {
        if (!roadmapId || (initialNodes && initialEdges)) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${roadmapId}`);

            if (response.data.success) {
                const roadmap: RoadmapData = response.data.data;

                const flowNodes = roadmap.nodes.map((node: RoadmapNodeData): Node<CustomRoadmapNodeData> => {
                    const nodeData = node.data;
                    const isLearning = userProgress?.currentNodeId === node.id;
                    const isCompleted = userProgress?.completedNodeIds.includes(node.id) || false;

                    if (nodeData && typeof nodeData === 'object') {
                        const level = nodeData.data?.level || node.level || 'OPTIONAL';
                        return {
                            id: node.id,
                            type: 'roadmapNode',
                            position: { x: node.position_x, y: node.position_y },
                            data: {
                                label: node.label,
                                content: node.content || '',
                                level: level,
                                deletable: true,
                                isLearning,
                                isCompleted
                            },
                            className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                        };
                    }

                    const level = node.level || 'OPTIONAL';
                    return {
                        id: node.id,
                        type: 'roadmapNode',
                        position: { x: node.position_x, y: node.position_y },
                        data: {
                            label: node.label,
                            content: node.content || '',
                            level: level,
                            deletable: true,
                            isLearning,
                            isCompleted
                        },
                        className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                    };
                });

                const flowEdges = roadmap.edges.map((edge: RoadmapEdgeData) => ({
                    id: edge.id,
                    source: edge.source_id,
                    target: edge.target_id,
                    type: 'smoothstep',
                    markerEnd: undefined
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } else {
                setError(response.data.error || 'Load roadmap lỗi!');
            }
        } catch {
            setError('Load roadmap lỗi!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roadmapId && !initialNodes && !initialEdges) {
            fetchRoadmapData();
        } else if (initialNodes) {
            const nodesWithStatus = initialNodes.map((node): Node<CustomRoadmapNodeData> => {
                const isLearning = userProgress?.currentNodeId === node.id;
                const isCompleted = userProgress?.completedNodeIds.includes(node.id) || false;
                const nodeData = node.data as CustomRoadmapNodeData;
                return {
                    ...node,
                    type: 'roadmapNode',
                    data: {
                        ...nodeData,
                        isLearning,
                        isCompleted
                    }
                };
            });
            setNodes(nodesWithStatus);
            if (initialEdges) {
                setEdges(initialEdges);
            }
        } else if (!roadmapId && !initialNodes && !initialEdges) {
            const initialNode: Node<CustomRoadmapNodeData> = {
                id: uuidv4(),
                type: 'roadmapNode',
                position: { x: 0, y: 0 },
                data: {
                    label: '-',
                    content: '',
                    level: 'REQUIRED',
                    deletable: false,
                    isLearning: false,
                    isCompleted: false
                },
                className: 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!'
            };
            setNodes([initialNode]);
        }
    }, [roadmapId, initialNodes, initialEdges, setNodes, setEdges, userProgress]);

    useEffect(() => {
        if (nodes.length > 0 && userProgress) {
            setNodes((currentNodes) =>
                currentNodes.map((node): Node<CustomRoadmapNodeData> => {
                    const isLearning = userProgress?.currentNodeId === node.id;
                    const isCompleted = userProgress?.completedNodeIds.includes(node.id) || false;
                    const nodeData = node.data as CustomRoadmapNodeData;
                    return {
                        ...node,
                        type: 'roadmapNode',
                        data: {
                            ...nodeData,
                            isLearning: isLearning || false,
                            isCompleted: isCompleted || false
                        }
                    };
                })
            );
        }
    }, [userProgress?.currentNodeId, userProgress?.completedNodeIds?.length, setNodes]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;

        if (selectedNode.data.deletable === false) return;

        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
        setSelectedNode(null);
    }, [selectedNode, setNodes, setEdges]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete') {
                handleDeleteNode();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleDeleteNode]);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, connectionState) => {
            if (!connectionState.isValid && connectionState.fromNode) {
                const fromNodeId = connectionState.fromNode.id;

                if (!('clientX' in event)) return;

                const targetIsNode = (event.target as HTMLElement).closest('.react-flow__node');
                if (targetIsNode) return;

                const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
                if (!reactFlowBounds) return;

                const position = screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY
                });

                const newNodeId = uuidv4();
                const newNode: Node<CustomRoadmapNodeData> = {
                    id: newNodeId,
                    type: 'roadmapNode',
                    position,
                    data: {
                        label: `-`,
                        content: '',
                        level: 'OPTIONAL',
                        deletable: true,
                        isLearning: false,
                        isCompleted: false
                    },
                    className: 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                };

                setNodes((nds) => nds.concat(newNode));

                if (fromNodeId) {
                    const newEdge: Edge = {
                        id: uuidv4(),
                        source: fromNodeId,
                        target: newNodeId,
                        type: 'smoothstep'
                    };
                    setEdges((eds) => eds.concat(newEdge));
                }
            }
        },
        [screenToFlowPosition, setNodes, setEdges]
    );

    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (viewOnly) {
                const apiNode = nodes.find((n) => n.id === node.id);

                if (apiNode) {
                    setSelectedNode(apiNode);
                    setIsDetailDrawerOpen(true);
                }
            } else {
                setSelectedNode(node);
            }
        },
        [viewOnly, nodes]
    );

    const onNodeDoubleClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (viewOnly) return;

            setSelectedNode(node);
            setIsEditingNode(true);
        },
        [viewOnly]
    );

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleNodeUpdate = (updatedData: { label: string; content: string; level: 'REQUIRED' | 'OPTIONAL' }) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const level = updatedData.level || (node.data.level as 'REQUIRED' | 'OPTIONAL');
                    const nodeClassName = level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!';

                    return {
                        ...node,
                        data: { ...node.data, ...updatedData },
                        className: nodeClassName
                    };
                }
                return node;
            })
        );

        setIsEditingNode(false);
        setSelectedNode(null);
    };

    const handleGenerate = async () => {
        if (!name.trim()) {
            setError('Tên roadmap không được để trống');
            return;
        }

        try {
            setGenerateLoading(true);
            setError(null);

            const response = await api.post<{
                success: boolean;
                data: {
                    name: string;
                    description: string | null;
                    topicIds: string[];
                    nodes: Node[];
                    edges: Edge[];
                };
                error?: string;
            }>(apiEndpoints.admin.genRoadmap, {
                name: name.trim(),
                description: (description || '').trim() || undefined
            });

            if (response.data.success) {
                const { description: newDescription, nodes: generatedNodes, edges: generatedEdges } = response.data.data;

                const transformedNodes = generatedNodes.map((node: Node) => {
                    const nodeData = node.data as { label: string; content?: string; level: 'REQUIRED' | 'OPTIONAL' };
                    const level = nodeData?.level || 'OPTIONAL';
                    const className = level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!';

                    return {
                        ...node,
                        type: 'roadmapNode',
                        data: {
                            ...nodeData,
                            deletable: true,
                            isLearning: false,
                            isCompleted: false
                        },
                        className
                    };
                });

                if (newDescription && onDescriptionChange) {
                    onDescriptionChange(newDescription);
                }

                setNodes(transformedNodes);
                setEdges(generatedEdges);
            } else {
                setError(response.data.error || 'Generate roadmap lỗi!');
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || 'Generate roadmap lỗi!');
            } else {
                setError('Generate roadmap lỗi!');
            }
        } finally {
            setGenerateLoading(false);
        }
    };

    const handleSave = () => {
        const flowObject = toObject();
        const { nodes, edges } = flowObject;
        const nodesToSave = nodes.map(({ className, ...node }) => node);
        const roadmapData = {
            name,
            description: description || '',
            topicIds,
            nodes: nodesToSave,
            edges: edges
        };

        onSave(roadmapData);
    };

    return (
        <div className='flex w-full flex-1 flex-col'>
            <div className='flex shrink-0 items-center justify-between'>
                <div>
                    <p className='text-lg font-semibold'>{name}</p>
                    {description && <p className='text-stone-600 dark:text-stone-400'>{description}</p>}
                </div>
                <div className='flex gap-2'>
                    {viewOnly && headerActions}
                    {!viewOnly && (
                        <>
                            {!roadmapId && (
                                <Button onClick={handleGenerate} disabled={loading || generateLoading} className='h-9 w-9 rounded-md bg-transparent p-0 text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700'>
                                    {generateLoading ? <FontAwesomeIcon icon={faCircleNotch} className='animate-spin' /> : <FontAwesomeIcon icon={faWandMagicSparkles} />}
                                </Button>
                            )}
                            <Button onClick={handleSave} disabled={loading || generateLoading}>
                                Lưu Roadmap
                            </Button>
                        </>
                    )}
                    <Button className='bg-transparent text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700' onClick={onCancel}>
                        {viewOnly ? 'Quay lại' : 'Hủy'}
                    </Button>
                </div>
            </div>
            <div className='relative flex flex-1 flex-col overflow-hidden' ref={reactFlowWrapper}>
                {loading ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='text-stone-500 dark:text-stone-400'>Đang tải...</div>
                    </div>
                ) : error ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='text-red-500 dark:text-red-400'>{error}</div>
                    </div>
                ) : (
                    <ReactFlow className='w-full! flex-1!' nodes={nodes} edges={edges} onNodesChange={viewOnly ? undefined : onNodesChange} onEdgesChange={viewOnly ? undefined : onEdgesChange} onConnect={viewOnly ? undefined : onConnect} onConnectEnd={viewOnly ? undefined : onConnectEnd} onNodeClick={onNodeClick} onNodeDoubleClick={onNodeDoubleClick} onPaneClick={onPaneClick} fitView nodesDraggable={!viewOnly} nodesConnectable={!viewOnly} elementsSelectable={true} defaultEdgeOptions={{ type: 'smoothstep' }} nodeTypes={{ roadmapNode: RoadmapNode }}>
                        <Background color='#aaa' gap={16} />
                    </ReactFlow>
                )}

                {isDetailDrawerOpen && selectedNode && (
                    <div className='absolute top-0 right-0 z-50 h-full w-80 rounded-md border border-white bg-white/10 shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] backdrop-blur-xs dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_0_9px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.3)]'>
                        <NodeDetailDrawer node={selectedNode} isOpen={isDetailDrawerOpen} onClose={() => setIsDetailDrawerOpen(false)} roadmapId={roadmapId} userProgress={userProgress} onNodeStatusChange={onNodeStatusChange} />
                    </div>
                )}
            </div>

            {isEditingNode && selectedNode && !viewOnly && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
                    <div className='max-h-[80vh] w-96 overflow-auto rounded-md border border-stone-300 bg-white p-4 text-stone-800 shadow-lg'>
                        <p className='mb-4 text-lg font-semibold'>Chỉnh sửa Node</p>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-sm font-medium'>Tiêu đề</p>
                                <Input type='text' defaultValue={selectedNode.data.label as string} id='node-title' />
                            </div>
                            <div>
                                <p className='mb-1 text-sm font-medium'>Nội dung</p>
                                <Textarea defaultValue={selectedNode.data.content as string} id='node-content' rows={3} />
                            </div>
                            <div>
                                <p className='mb-1 text-sm font-medium'>Level</p>
                                <select defaultValue={selectedNode.data.level as string} id='node-level' className='w-full rounded border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:ring-2 focus:ring-stone-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200'>
                                    <option value='OPTIONAL'>Tùy chọn</option>
                                    <option value='REQUIRED'>Bắt buộc</option>
                                </select>
                            </div>
                        </div>
                        <div className='mt-4 flex justify-end space-x-2'>
                            <Button className='bg-stone-200 text-stone-800 hover:bg-stone-300' onClick={() => setIsEditingNode(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={() => {
                                    const label = (document.getElementById('node-title') as HTMLInputElement).value;
                                    const content = (document.getElementById('node-content') as HTMLTextAreaElement).value;
                                    const level = (document.getElementById('node-level') as HTMLSelectElement).value as 'REQUIRED' | 'OPTIONAL';

                                    handleNodeUpdate({ label, content, level });
                                }}
                            >
                                Lưu
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoadmapNode: FC<NodeProps<Node<CustomRoadmapNodeData>>> = ({ data, selected }) => {
    const isLearning = data.isLearning || false;
    const isCompleted = data.isCompleted || false;

    return (
        <div className={`relative rounded-md transition-all duration-300 ${selected ? 'shadow-xl ring-2 ring-stone-600 ring-offset-2 dark:ring-stone-400 dark:ring-offset-stone-800' : ''}`}>
            <Handle type='target' position={Position.Top} />
            <div className='relative flex items-center justify-between gap-2 px-3 py-2'>
                <div className='truncate text-sm leading-none'>{data.label}</div>
                {isCompleted && (
                    <div className='h-6 w-6 shrink-0'>
                        <Lottie animationData={CompletedImage} loop={true} className='h-full w-full' />
                    </div>
                )}
            </div>
            {isLearning && (
                <div className='absolute bottom-0 left-1/2 h-10 w-10 -translate-x-1/2 translate-y-full'>
                    <Lottie animationData={LearningImage} loop={true} className='h-full w-full' />
                </div>
            )}
            <Handle type='source' position={Position.Bottom} />
        </div>
    );
};

type NodeDetailDrawerProps = {
    node: Node | null;
    isOpen: boolean;
    onClose: () => void;
    roadmapId?: string;
    userProgress?: UserProgress;
    onNodeStatusChange?: () => void;
};

const NodeDetailDrawer: FC<NodeDetailDrawerProps> = ({ node, isOpen, onClose, roadmapId, userProgress, onNodeStatusChange }) => {
    const { isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    if (!isOpen || !node) return null;

    const isLearning = userProgress?.currentNodeId === node.id;
    const isCompleted = userProgress?.completedNodeIds.includes(node.id) || false;

    const handleToggleLearning = async () => {
        if (!roadmapId || !isAuthenticated || isLoading) return;

        try {
            setIsLoading(true);
            const response = await api.post(apiEndpoints.me.roadmapNodeLearning(roadmapId, node.id));

            if (response.data.success) {
                onNodeStatusChange?.();
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || 'toggle learning fail');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComplete = async () => {
        if (!roadmapId || !isAuthenticated || isCompleting) return;

        try {
            setIsCompleting(true);
            const response = await api.post(apiEndpoints.me.roadmapNodeComplete(roadmapId, node.id));

            if (response.data.success) {
                onNodeStatusChange?.();
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || 'toggle complete fail');
            }
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className='flex h-full flex-col p-4 font-semibold text-stone-800 dark:text-stone-200'>
            <div className='flex items-center justify-between border-b border-white/20 pb-4 dark:border-stone-700'>
                <p className='text-lg font-semibold text-stone-800 dark:text-stone-200'>{String(node.data.label)}</p>
                <button onClick={onClose} className='text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            <div className='flex-1 overflow-auto pt-4'>{Boolean(node.data.content) && typeof node.data.content === 'string' && <p className='text-base whitespace-pre-wrap text-stone-700 dark:text-stone-300'>{node.data.content}</p>}</div>

            {isAuthenticated && roadmapId && (
                <div className='mt-4 flex shrink-0 gap-2 border-t border-white/20 pt-4 dark:border-stone-700'>
                    {isCompleted ? (
                        <div className='flex flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 bg-stone-100 px-4 py-2 text-stone-600 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-400'>
                            <FontAwesomeIcon icon={faCheck} className='mr-2' />
                        </div>
                    ) : isLearning ? (
                        <Button onClick={handleToggleComplete} disabled={isLoading || isCompleting} className='h-9 w-9 rounded-md border-stone-800 bg-transparent p-0 text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'>
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                    ) : (
                        <Button onClick={handleToggleLearning} disabled={isLoading || isCompleting} className='h-9 w-9 rounded-md border-stone-800 bg-transparent p-0 text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'>
                            <FontAwesomeIcon icon={faBookOpen} />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

const RoadmapFlowWithProvider: FC<RoadmapFlowProps> = (props) => {
    return (
        <ReactFlowProvider>
            <RoadmapFlow {...props} />
        </ReactFlowProvider>
    );
};

export default RoadmapFlowWithProvider;
