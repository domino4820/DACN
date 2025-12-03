import MESSAGES from '@/config/message.js';
import { zValidator } from '@hono/zod-validator';
import axios from 'axios';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = new Hono();

const genRoadmapSchema = z.object({
    name: z.string().min(1, 'name không được để trống'),
    description: z.string().optional()
});

app.post('/', zValidator('json', genRoadmapSchema), async (c) => {
    try {
        const { name, description } = c.req.valid('json');

        try {
            const response = await axios.post(
                'https://api.ovfteam.com',
                {
                    messages: [
                        {
                            role: 'system',
                            content: `Bạn là chuyên gia tạo roadmap học tập CỰC KỲ CHI TIẾT và DỄ HIỂU cho người mới bắt đầu. Nhiệm vụ của bạn là tạo roadmap JSON hoàn chỉnh theo format chuẩn.

QUAN TRỌNG: Bạn PHẢI trả về JSON thuần, không có markdown code block, không có giải thích thêm. Chỉ trả về JSON object.

MỤC TIÊU: Tạo roadmap CỰC KỲ CHI TIẾT, DỄ HIỂU NHẤT cho người mới bắt đầu học. Roadmap phải:
- Chia nhỏ từng bước học tập thành các node rõ ràng, cụ thể
- Mỗi node phải có mô tả chi tiết (content) giải thích rõ ràng cần học gì, tại sao cần học
- Nhiều nodes (tối thiểu 15-20 nodes, có thể nhiều hơn nếu cần)
- Nhiều edges để tạo flow học tập logic, rõ ràng
- Bắt đầu từ những kiến thức cơ bản nhất, dễ nhất
- Mỗi bước phải có lý do rõ ràng và kết nối logic với bước trước/sau

JSON Schema format:
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number", "minimum": 0, "maximum": 1000 },
              "y": { "type": "number" }
            },
            "required": ["x", "y"]
          },
          "data": {
            "type": "object",
            "properties": {
              "label": { "type": "string" },
              "content": { "type": "string" },
              "level": { "type": "string", "enum": ["REQUIRED", "OPTIONAL"] }
            },
            "required": ["label", "level"]
          }
        },
        "required": ["position", "data"]
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source": { "type": "number", "minimum": 0 },
          "target": { "type": "number", "minimum": 0 }
        },
        "required": ["source", "target"]
      }
    }
  },
  "required": ["name", "description", "nodes", "edges"]
}

YÊU CẦU CHI TIẾT:

1. Nodes (TỐI THIỂU 15-20 nodes, có thể nhiều hơn):
   - KHÔNG cần tạo id, type (code sẽ tự generate UUID và set type="roadmapNode")
   - position.x: number từ 0 đến 1000 (khuyến nghị: 0, 250, 500, 750 để căn giữa)
   - position.y: number tăng dần theo flow học tập (node đầu tiên y=0 hoặc y nhỏ nhất)
   - data.label: string tiếng Việt, tiêu đề node NGẮN GỌN, RÕ RÀNG (bắt buộc)
   - data.content: string tiếng Việt, MÔ TẢ CHI TIẾT (BẮT BUỘC phải có cho mọi node):
     * Giải thích rõ ràng node này dạy gì
     * Tại sao cần học node này
     * Các khái niệm/concepts chính cần nắm
     * Ví dụ cụ thể nếu có thể
     * Mức độ quan trọng
   - data.level: "REQUIRED" (bắt buộc) hoặc "OPTIONAL" (tùy chọn) - mặc định "REQUIRED"
   - Chia nhỏ kiến thức: thay vì 1 node lớn, chia thành nhiều node nhỏ, dễ hiểu
   - Bắt đầu từ cơ bản nhất: node đầu tiên phải là kiến thức cơ bản nhất, dễ nhất

2. Edges (NHIỀU edges để tạo flow rõ ràng):
   - source và target là index (số thứ tự) của nodes trong mảng, bắt đầu từ 0
   - KHÔNG cần tạo id, type (code sẽ tự generate UUID và set type="smoothstep")
   - Không được có self-loop (source !== target)
   - Tạo flow logic từ cơ bản đến nâng cao
   - Mỗi node nên có ít nhất 1 edge đi vào (trừ node đầu tiên) và 1 edge đi ra (trừ node cuối)
   - Có thể có nhiều đường đi song song nếu có nhiều cách học khác nhau
   - Tạo edges để người học hiểu rõ thứ tự và mối quan hệ giữa các nodes

3. Layout và Flow:
   - Nodes sắp xếp theo flow từ trên xuống dưới (y tăng dần)
   - Node đầu tiên (y nhỏ nhất): kiến thức cơ bản nhất, dễ nhất
   - Có thể có nhiều nodes cùng level (cùng y) nếu là các topics song song, có thể học đồng thời
   - Edges tạo đường đi logic, rõ ràng, dễ theo dõi
   - Đảm bảo người mới bắt đầu có thể đi theo roadmap từ đầu đến cuối một cách tự nhiên

4. Chi tiết và Dễ hiểu:
   - Mỗi node phải có content mô tả CHI TIẾT, không được bỏ qua
   - Giải thích bằng ngôn ngữ đơn giản, dễ hiểu cho người mới
   - Chia nhỏ kiến thức phức tạp thành nhiều bước nhỏ
   - Đảm bảo mỗi bước đều có lý do và mục đích rõ ràng

Ví dụ structure:
{
  "name": "Tên roadmap",
  "description": "Mô tả roadmap chi tiết",
  "nodes": [
    {
      "position": { "x": 250, "y": 0 },
      "data": {
        "label": "Giới thiệu cơ bản",
        "content": "Bước đầu tiên này giúp bạn hiểu tổng quan về chủ đề. Bạn sẽ học các khái niệm cơ bản nhất, tại sao cần học, và những gì bạn sẽ đạt được sau khi hoàn thành roadmap này. Đây là nền tảng quan trọng để bạn có động lực và hiểu rõ mục tiêu học tập.",
        "level": "REQUIRED"
      }
    },
    {
      "position": { "x": 250, "y": 150 },
      "data": {
        "label": "Cài đặt môi trường",
        "content": "Học cách cài đặt và thiết lập môi trường làm việc. Bước này rất quan trọng vì bạn cần có công cụ phù hợp để bắt đầu học. Chúng ta sẽ hướng dẫn từng bước một cách chi tiết, đảm bảo bạn có thể làm theo dễ dàng.",
        "level": "REQUIRED"
      }
    }
  ],
  "edges": [
    { "source": 0, "target": 1 }
  ]
}`
                        },
                        {
                            role: 'user',
                            content: (() => {
                                const descPart = description ? `\n\nMô tả roadmap: ${description}` : '';
                                return `Tạo roadmap CỰC KỲ CHI TIẾT và DỄ HIỂU với tên: "${name}".${descPart}

YÊU CẦU ĐẶC BIỆT:
- Roadmap phải CỰC KỲ CHI TIẾT, chia nhỏ từng bước học tập
- Dễ hiểu NHẤT cho người mới bắt đầu, chưa có kiến thức gì
- Tối thiểu 15-20 nodes (có thể nhiều hơn nếu cần)
- Mỗi node PHẢI có content mô tả chi tiết, giải thích rõ ràng
- Nhiều edges để tạo flow học tập logic, rõ ràng
- Bắt đầu từ kiến thức cơ bản nhất, dễ nhất
- Mỗi bước phải có lý do và mục đích rõ ràng`;
                            })()
                        }
                    ],
                    thinking: {
                        type: 'disabled'
                    },
                    temperature: 0.7,
                    max_tokens: 4096,
                    stream: false,
                    response_format: {
                        type: 'json_object'
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = response.data as {
                choices?: Array<{ message?: { content?: string } }>;
            };
            const aiContent = data.choices?.[0]?.message?.content;

            if (!aiContent) {
                return c.json(
                    {
                        success: false,
                        error: 'OVF API không trả về nội dung'
                    },
                    500
                );
            }

            let roadmapJson: any;
            try {
                roadmapJson = JSON.parse(aiContent);
            } catch (parseError) {
                console.log('parse json error:', parseError);
                return c.json(
                    {
                        success: false,
                        error: 'Response từ OVF API không phải JSON hợp lệ'
                    },
                    500
                );
            }

            const { name: aiName, description: roadmapDesc, nodes, edges } = roadmapJson;

            if (!aiName || typeof aiName !== 'string') {
                return c.json(
                    {
                        success: false,
                        error: 'Format roadmap từ AI không hợp lệ: thiếu name hoặc name không phải string'
                    },
                    400
                );
            }

            if (roadmapDesc !== undefined && typeof roadmapDesc !== 'string') {
                return c.json(
                    {
                        success: false,
                        error: 'Format roadmap từ AI không hợp lệ: description phải là string'
                    },
                    400
                );
            }

            if (!Array.isArray(nodes) || !Array.isArray(edges)) {
                return c.json(
                    {
                        success: false,
                        error: 'Format roadmap từ AI không hợp lệ: nodes và edges phải là array'
                    },
                    400
                );
            }

            if (nodes.length < 15) {
                return c.json(
                    {
                        success: false,
                        error: `Roadmap cần ít nhất 15 nodes để đảm bảo chi tiết. Hiện tại chỉ có ${nodes.length} nodes`
                    },
                    400
                );
            }

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
                    return c.json(
                        {
                            success: false,
                            error: `Node ${i} thiếu position hoặc position không hợp lệ`
                        },
                        400
                    );
                }
                if (node.position.x < 0 || node.position.x > 1000) {
                    return c.json(
                        {
                            success: false,
                            error: `Node ${i} position.x phải trong khoảng 0-1000`
                        },
                        400
                    );
                }
                if (!node.data?.label || typeof node.data.label !== 'string') {
                    return c.json(
                        {
                            success: false,
                            error: `Node ${i} thiếu data.label hoặc label không hợp lệ`
                        },
                        400
                    );
                }
                if (!node.data.content || typeof node.data.content !== 'string' || node.data.content.trim().length === 0) {
                    console.log(`warning: node ${i} thiếu content mô tả chi tiết`);
                }
                if (node.data.level && node.data.level !== 'REQUIRED' && node.data.level !== 'OPTIONAL') {
                    return c.json(
                        {
                            success: false,
                            error: `Node ${i} data.level phải là "REQUIRED" hoặc "OPTIONAL"`
                        },
                        400
                    );
                }
            }

            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                if (typeof edge.source !== 'number' || typeof edge.target !== 'number') {
                    return c.json(
                        {
                            success: false,
                            error: `Edge ${i} source và target phải là số (index của node)`
                        },
                        400
                    );
                }
                if (edge.source < 0 || edge.source >= nodes.length) {
                    return c.json(
                        {
                            success: false,
                            error: `Edge ${i} source index ${edge.source} không hợp lệ (phải từ 0 đến ${nodes.length - 1})`
                        },
                        400
                    );
                }
                if (edge.target < 0 || edge.target >= nodes.length) {
                    return c.json(
                        {
                            success: false,
                            error: `Edge ${i} target index ${edge.target} không hợp lệ (phải từ 0 đến ${nodes.length - 1})`
                        },
                        400
                    );
                }
                if (edge.source === edge.target) {
                    return c.json(
                        {
                            success: false,
                            error: `Edge ${i} không được self-loop (source === target)`
                        },
                        400
                    );
                }
            }

            const finalName = name;
            const finalDescription = description ?? roadmapDesc ?? '';

            const nodeIdMap = new Map<number, string>();
            const validatedNodes = nodes.map((node: any, index: number) => {
                const nodeId = uuidv4();
                nodeIdMap.set(index, nodeId);
                return {
                    id: nodeId,
                    type: 'roadmapNode',
                    position: node.position,
                    data: {
                        label: node.data.label,
                        ...(node.data.content && { content: node.data.content }),
                        level: node.data.level || 'REQUIRED'
                    }
                };
            });

            const validatedEdges = edges.map((edge: any) => {
                const sourceId = nodeIdMap.get(edge.source);
                const targetId = nodeIdMap.get(edge.target);
                if (!sourceId || !targetId) {
                    throw new Error(`edge map fail: source=${edge.source}, target=${edge.target}`);
                }
                return {
                    id: uuidv4(),
                    source: sourceId,
                    target: targetId,
                    type: 'smoothstep'
                };
            });

            return c.json(
                {
                    success: true,
                    data: {
                        name: finalName,
                        description: finalDescription,
                        topicIds: [],
                        nodes: validatedNodes,
                        edges: validatedEdges
                    }
                },
                200
            );
        } catch (axiosError: any) {
            if (axios.isAxiosError(axiosError)) {
                const errorText = axiosError.response?.data || axiosError.message;
                console.log('ovf api error:', errorText);
                return c.json(
                    {
                        success: false,
                        error: 'Gọi OVF API thất bại'
                    },
                    500
                );
            }
            throw axiosError;
        }
    } catch (error) {
        console.log('gen roadmap error:', error);
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
