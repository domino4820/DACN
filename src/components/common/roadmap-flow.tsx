import Button from '@/components/admin/ui/button';
import apiEndpoints from '@/config/api-endpoints';
import api from '@/utils/api';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { addEdge, Background, Controls, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';

type RoadmapNode = {
    position_x: number;
    position_y: number;
    node_type: string;
    label: string;
    content?: string;
    level: 'REQUIRED' | 'OPTIONAL';
    data?: any;
};

type RoadmapEdge = {
    source_id: string;
    target_id: string;
};

type RoadmapFlowProps = {
    name: string;
    description: string;
    topicIds: string[];
    onSave: (data: { name: string; description: string; topicIds: string[]; nodes: RoadmapNode[]; edges: RoadmapEdge[] }) => void;
    onCancel: () => void;
    roadmapId?: string;
    viewOnly?: boolean;
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const RoadmapFlow: FC<RoadmapFlowProps> = ({ name, description, topicIds, onSave, onCancel, roadmapId, viewOnly = false }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isEditingNode, setIsEditingNode] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoadmapData = async () => {
        if (!roadmapId) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${roadmapId}`);

            if (response.data.success) {
                const roadmap = response.data.data;

                const nodeIdToPositionKey = new Map();
                for (const node of roadmap.nodes) {
                    const positionKey = `${Math.round(node.position_x)}_${Math.round(node.position_y)}`;
                    nodeIdToPositionKey.set(node.id, positionKey);
                }

                const flowNodes = roadmap.nodes.map((node: any) => ({
                    id: `${Math.round(node.position_x)}_${Math.round(node.position_y)}`,
                    type: node.node_type || 'default',
                    position: { x: node.position_x, y: node.position_y },
                    data: {
                        label: node.label,
                        content: node.content || '',
                        level: node.level
                    },
                    style: node.level === 'REQUIRED' ? { background: '#ffffff', border: '2px solid #000000', cursor: 'pointer' } : { background: '#ffffff', border: '1px solid #d1d5db', cursor: 'pointer' }
                }));

                const flowEdges = roadmap.edges
                    .map((edge: any) => {
                        const sourceKey = nodeIdToPositionKey.get(edge.source_id);
                        const targetKey = nodeIdToPositionKey.get(edge.target_id);

                        if (sourceKey && targetKey) {
                            return {
                                id: edge.id,
                                source: sourceKey,
                                target: targetKey
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                setNodes(flowNodes.length > 0 ? flowNodes : initialNodes);
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

        const nodeStyle = updatedData.level === 'REQUIRED' ? { background: '#ffffff', border: '2px solid #000000' } : { background: '#ffffff', border: '1px solid #d1d5db' };

        setNodes((nds) => nds.map((node) => (node.id === selectedNode.id ? { ...node, data: { ...node.data, ...updatedData }, style: nodeStyle } : node)));

        setIsEditingNode(false);
        setSelectedNode(null);
    };

    const handleSave = () => {
        const roadmapNodes = nodes.map((node) => ({
            position_x: node.position.x,
            position_y: node.position.y,
            node_type: node.type || 'default',
            label: node.data.label as string,
            content: (node.data.content as string) || '',
            level: node.data.level as 'REQUIRED' | 'OPTIONAL',
            data: node.data
        }));

        const roadmapEdges = edges.map((edge) => ({
            source_id: edge.source,
            target_id: edge.target
        }));

        const roadmapData = {
            name,
            description,
            topicIds,
            nodes: roadmapNodes,
            edges: roadmapEdges
        };

        onSave(roadmapData);
    };

    const addNode = () => {
        const positionX = Math.round(Math.random() * 400 + 50);
        const positionY = Math.round(Math.random() * 300 + 50);
        const newNode: Node = {
            id: `${positionX}_${positionY}`,
            type: 'default',
            position: {
                x: positionX,
                y: positionY
            },
            data: {
                label: '',
                content: '',
                level: 'OPTIONAL'
            },
            style: {
                background: '#ffffff',
                border: '1px solid #d1d5db'
            }
        };
        setNodes((nds) => [...nds, newNode]);
    };

    return (
        <div className='flex w-full flex-1 flex-col'>
            <div className='flex shrink-0 items-center justify-between'>
                <div>
                    <p className='text-lg font-semibold'>{name}</p>
                    {description && <p className='text-stone-600'>{description}</p>}
                </div>
                <div className='flex gap-2'>
                    {!viewOnly && (
                        <>
                            <Button onClick={addNode} disabled={loading}>
                                Thêm Node
                            </Button>
                            <Button onClick={handleSave} disabled={loading}>
                                Lưu Roadmap
                            </Button>
                        </>
                    )}
                    <Button className='bg-transparent text-stone-800 hover:bg-stone-100' onClick={onCancel}>
                        {viewOnly ? 'Quay lại' : 'Hủy'}
                    </Button>
                </div>
            </div>
            <div className='relative flex flex-1 flex-col overflow-hidden'>
                {loading ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='text-stone-500'>Đang tải...</div>
                    </div>
                ) : error ? (
                    <div className='flex h-full items-center justify-center'>
                        <div className='text-red-500'>{error}</div>
                    </div>
                ) : (
                    <ReactFlow className='w-full flex-1' nodes={nodes} edges={edges} onNodesChange={viewOnly ? undefined : onNodesChange} onEdgesChange={viewOnly ? undefined : onEdgesChange} onConnect={viewOnly ? undefined : onConnect} onNodeClick={onNodeClick} fitView nodesDraggable={!viewOnly} nodesConnectable={!viewOnly} elementsSelectable={!viewOnly}>
                        <Controls />
                        <Background />
                    </ReactFlow>
                )}

                {isDetailDrawerOpen && selectedNode && (
                    <div className='absolute top-0 right-0 z-50 h-full w-80 bg-white shadow-lg'>
                        <NodeDetailDrawer node={selectedNode} isOpen={isDetailDrawerOpen} onClose={() => setIsDetailDrawerOpen(false)} />
                    </div>
                )}
            </div>

            {isEditingNode && selectedNode && !viewOnly && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
                    <div className='max-h-[80vh] w-96 overflow-auto rounded-lg bg-white p-6 shadow-lg'>
                        <p className='mb-4 text-lg font-semibold'>Chỉnh sửa Node</p>
                        <div className='space-y-4'>
                            <div>
                                <p className='mb-1 text-sm font-medium'>Tiêu đề</p>
                                <input type='text' defaultValue={selectedNode.data.label as string} id='node-title' className='w-full rounded border border-gray-300 px-3 py-2' />
                            </div>
                            <div>
                                <p className='mb-1 text-sm font-medium'>Nội dung</p>
                                <textarea defaultValue={selectedNode.data.content as string} id='node-content' rows={3} className='w-full rounded border border-gray-300 px-3 py-2' />
                            </div>
                            <div>
                                <select defaultValue={selectedNode.data.level as string} id='node-level' className='w-full rounded border border-gray-300 px-3 py-2'>
                                    <option value='OPTIONAL'>Tùy chọn</option>
                                    <option value='REQUIRED'>Bắt buộc</option>
                                </select>
                            </div>
                        </div>
                        <div className='mt-6 flex justify-end space-x-2'>
                            <Button className='bg-transparent text-stone-800 hover:bg-stone-100' onClick={() => setIsEditingNode(false)}>
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
        <div className='flex h-full flex-col'>
            <div className='flex items-center justify-between border-b p-4'>
                <p className='text-lg font-semibold'>{String(node.data.label)}</p>
                <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            <div className='flex-1 overflow-auto p-4'>{Boolean(node.data.content) && typeof node.data.content === 'string' && <p className='text-base whitespace-pre-wrap'>{node.data.content}</p>}</div>
        </div>
    );
};

export default RoadmapFlow;
