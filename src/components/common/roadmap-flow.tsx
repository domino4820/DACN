import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import Textarea from '@/components/admin/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import api from '@/utils/api';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { addEdge, Background, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, type Connection, type Edge, type Node } from '@xyflow/react';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';

type RoadmapFlowProps = {
    name: string;
    description: string;
    topicIds: string[];
    onSave: (data: { name: string; description: string; topicIds: string[]; nodes: Node[]; edges: Edge[] }) => void;
    onCancel: () => void;
    roadmapId?: string;
    viewOnly?: boolean;
};

const RoadmapFlow: FC<RoadmapFlowProps> = ({ name, description, topicIds, onSave, onCancel, roadmapId, viewOnly = false }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
    const { toObject, screenToFlowPosition } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isEditingNode, setIsEditingNode] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectionInProgress, setConnectionInProgress] = useState<{ source: string | null }>({ source: null });
    const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const fetchRoadmapData = async () => {
        if (!roadmapId) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${roadmapId}`);

            if (response.data.success) {
                const roadmap = response.data.data;

                const flowNodes = roadmap.nodes.map((node: any) => {
                    const nodeData = node.data;
                    if (nodeData && typeof nodeData === 'object') {
                        const level = nodeData.data?.level || nodeData.data?.data?.level || 'OPTIONAL';
                        return {
                            ...nodeData,
                            className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                        };
                    }

                    return {
                        id: node.id,
                        type: node.node_type || 'default',
                        position: { x: node.position_x, y: node.position_y },
                        data: {
                            label: node.label,
                            content: node.content || '',
                            level: node.level
                        },
                        className: node.level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                    };
                });

                const flowEdges = roadmap.edges.map((edge: any) => ({
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
        if (roadmapId) {
            fetchRoadmapData();
        }
    }, [roadmapId]);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onConnectStart = useCallback((_: any, { nodeId }: { nodeId: string | null }) => {
        setConnectionInProgress({ source: nodeId });
    }, []);

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            if (!connectionInProgress.source) return;

            const targetIsPane = (event.target as HTMLElement).classList.contains('react-flow__pane');

            if (targetIsPane) {
                const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
                if (!reactFlowBounds) return;

                let clientX: number;
                let clientY: number;

                if ('clientX' in event) {
                    clientX = event.clientX;
                    clientY = event.clientY;
                } else {
                    const touchEvent = event as any;
                    const firstTouch = touchEvent.touches?.[0];
                    if (!firstTouch) return;

                    clientX = firstTouch.clientX;
                    clientY = firstTouch.clientY;
                }

                const position = screenToFlowPosition({
                    x: clientX,
                    y: clientY
                });

                const newNode: Node = {
                    id: uuidv4(),
                    type: 'default',
                    position,
                    data: {
                        label: '',
                        content: '',
                        level: 'OPTIONAL'
                    },
                    className: 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                };

                setNodes((nds) => nds.concat(newNode));

                if (connectionInProgress.source) {
                    const newEdge: Edge = {
                        id: uuidv4(),
                        source: connectionInProgress.source,
                        target: newNode.id,
                        type: 'smoothstep'
                    };
                    setEdges((eds) => eds.concat(newEdge));
                }
            }

            setConnectionInProgress({ source: null });
        },
        [connectionInProgress.source, screenToFlowPosition, setNodes, setEdges]
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
                setIsEditingNode(true);
            }
        },
        [viewOnly, nodes]
    );

    const handleNodeUpdate = (updatedData: any) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const level = updatedData.level || node.data.level;
                    const nodeClassName = level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!';

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

    const handleSave = () => {
        const flowObject = toObject();
        const { nodes, edges } = flowObject;
        const nodesToSave = nodes.map(({ className, ...node }) => node);
        const roadmapData = {
            name,
            description,
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
                    {!viewOnly && (
                        <Button onClick={handleSave} disabled={loading}>
                            Lưu Roadmap
                        </Button>
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
                    <ReactFlow className='w-full! flex-1!' nodes={nodes} edges={edges} onNodesChange={viewOnly ? undefined : onNodesChange} onEdgesChange={viewOnly ? undefined : onEdgesChange} onConnect={viewOnly ? undefined : onConnect} onConnectStart={viewOnly ? undefined : onConnectStart} onConnectEnd={viewOnly ? undefined : onConnectEnd} onNodeClick={onNodeClick} fitView nodesDraggable={!viewOnly} nodesConnectable={!viewOnly} elementsSelectable={!viewOnly} defaultEdgeOptions={{ type: 'smoothstep' }}>
                        <Background color='#aaa' gap={16} />
                    </ReactFlow>
                )}

                {isDetailDrawerOpen && selectedNode && (
                    <div className='absolute top-0 right-0 z-50 h-full w-80 rounded-md border border-white bg-white/10 shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] backdrop-blur-xs dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_0_9px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.3)]'>
                        <NodeDetailDrawer node={selectedNode} isOpen={isDetailDrawerOpen} onClose={() => setIsDetailDrawerOpen(false)} />
                    </div>
                )}
            </div>

            {isEditingNode && selectedNode && !viewOnly && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
                    <div className='max-h-[80vh] w-96 overflow-auto rounded-md border border-stone-300 bg-white p-6 text-stone-800 shadow-lg'>
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
                                <select defaultValue={selectedNode.data.level as string} id='node-level' className='w-full rounded border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                                    <option value='OPTIONAL'>Tùy chọn</option>
                                    <option value='REQUIRED'>Bắt buộc</option>
                                </select>
                            </div>
                        </div>
                        <div className='mt-6 flex justify-end space-x-2'>
                            <Button className='bg-stone-200 text-stone-800 hover:bg-stone-300' onClick={() => setIsEditingNode(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={() => {
                                    const label = (document.getElementById('node-title') as HTMLInputElement).value;
                                    const content = (document.getElementById('node-content') as HTMLTextAreaElement).value;
                                    const level = (document.getElementById('node-level') as HTMLSelectElement).value;

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

type NodeDetailDrawerProps = {
    node: Node | null;
    isOpen: boolean;
    onClose: () => void;
};

const NodeDetailDrawer: FC<NodeDetailDrawerProps> = ({ node, isOpen, onClose }) => {
    if (!isOpen || !node) return null;

    return (
        <div className='flex h-full flex-col p-4 font-semibold text-stone-800 dark:text-stone-200'>
            <div className='flex items-center justify-between border-b border-white/20 pb-4 dark:border-stone-700'>
                <p className='text-lg font-semibold text-stone-800 dark:text-stone-200'>{String(node.data.label)}</p>
                <button onClick={onClose} className='text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            <div className='flex-1 overflow-auto pt-4'>{Boolean(node.data.content) && typeof node.data.content === 'string' && <p className='text-base whitespace-pre-wrap text-stone-700 dark:text-stone-300'>{node.data.content}</p>}</div>
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
