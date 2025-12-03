import MESSAGES from '@/config/message.js';
import { zValidator } from '@hono/zod-validator';
import axios from 'axios';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = new Hono();

// schema input: name, description
// output: JSON roadmap với nodes và edges (không lưu DB)
// frontend sẽ dùng response này để gọi PUT /api/admin/roadmap để lưu vào DB
const genRoadmapSchema = z.object({
    name: z.string().min(1, 'name không được để trống'),
    description: z.string().optional()
});

app.post('/', zValidator('json', genRoadmapSchema), async (c) => {
    try {
        const { name, description } = c.req.valid('json');

        // lấy GLM API key từ env hoặc config
        // const config = await prisma.config.findUnique({
        //     where: { id: 'singleton' }
        // });

        const apiKey = '50c709ba45f34893a713d28bc6de958c.MhUH4K7YZFUBWxLI';

        if (!apiKey) {
            return c.json(
                {
                    success: false,
                    error: 'GLM API key chưa được cấu hình'
                },
                400
            );
        }

        // TypeScript guard: apiKey đã được check ở trên
        const validApiKey: string = apiKey;

        // gọi GLM-4.6 API với conversation flow (dùng assistant message)
        // dùng Coding API cho GLM Coding Plan
        try {
            const response = await axios.post(
                'https://api.z.ai/api/coding/paas/v4/chat/completions',
                {
                    model: 'glm-4.5-flash',
                    messages: [
                        {
                            role: 'user',
                            content: (() => {
                                const descPart = description ? `\n\nMô tả roadmap: ${description}` : '';
                                return `Bạn là một chuyên gia tạo roadmap học tập. Tôi cần bạn tạo một roadmap JSON hoàn chỉnh với tên: "${name}".${descPart}`;
                            })()
                        },
                        {
                            role: 'assistant',
                            content: 'Tôi hiểu rồi. Để tạo roadmap phù hợp, tôi sẽ phân tích chủ đề và tạo một roadmap học tập có cấu trúc logic với các nodes và edges kết nối. Bạn có muốn tôi bắt đầu tạo roadmap JSON ngay không?'
                        },
                        {
                            role: 'user',
                            content: `Vâng, hãy tạo roadmap JSON ngay. Yêu cầu chi tiết:
1. Tên roadmap phải là: "${name}"
2. Mô tả roadmap: ${description || 'tạo mô tả ngắn gọn phù hợp'}
3. Tạo ít nhất 5-10 nodes với:
   - id: dùng UUID format
   - position: x, y hợp lý (x: 0-1000, y: tăng dần theo flow)
   - data.label: tiêu đề node (tiếng Việt)
   - data.content: mô tả chi tiết (tiếng Việt, optional)
   - data.level: "REQUIRED" hoặc "OPTIONAL"
5. Tạo edges kết nối nodes theo logic học tập (từ cơ bản đến nâng cao)
6. Đảm bảo không có self-loop (source !== target)

Format JSON chính xác theo schema sau (chỉ trả về JSON, không có markdown, không có giải thích):
{
  "name": "string",
  "description": "string",
  "nodes": [
    {
      "id": "string",
      "type": "roadmapNode",
      "position": { "x": number, "y": number },
      "data": {
        "label": "string",
        "content": "string (optional)",
        "level": "REQUIRED" | "OPTIONAL"
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "type": "smoothstep"
    }
  ]
}`
                        }
                    ],
                    thinking: {
                        type: 'disabled'
                    },
                    temperature: 0.7,
                    max_tokens: 4096,
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${validApiKey}`
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
                        error: 'GLM API không trả về nội dung'
                    },
                    500
                );
            }

            // parse JSON từ response (có thể có markdown code block)
            let roadmapJson: any;
            try {
                // thử parse trực tiếp
                roadmapJson = JSON.parse(aiContent);
            } catch {
                // nếu fail, thử extract từ markdown code block
                const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
                const jsonMatch = jsonRegex.exec(aiContent);
                if (jsonMatch?.[1]) {
                    roadmapJson = JSON.parse(jsonMatch[1]);
                } else {
                    // thử tìm JSON object trong text
                    const jsonObjRegex = /\{[\s\S]*\}/;
                    const jsonObjMatch = jsonObjRegex.exec(aiContent);
                    if (jsonObjMatch?.[0]) {
                        roadmapJson = JSON.parse(jsonObjMatch[0]);
                    } else {
                        throw new Error('không parse được JSON từ response');
                    }
                }
            }

            // validate và transform data
            const { name: aiName, description: roadmapDesc, nodes, edges } = roadmapJson;

            if (!aiName || !Array.isArray(nodes) || !Array.isArray(edges)) {
                return c.json(
                    {
                        success: false,
                        error: 'Format roadmap từ AI không hợp lệ'
                    },
                    400
                );
            }

            // dùng name từ input, không dùng từ AI
            const finalName = name;
            const finalDescription = description || roadmapDesc || null;

            // validate nodes và edges
            const nodeIds = new Set(nodes.map((n: any) => n.id));
            for (const edge of edges) {
                if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
                    return c.json(
                        {
                            success: false,
                            error: 'Edge reference đến node không tồn tại'
                        },
                        400
                    );
                }
                if (edge.source === edge.target) {
                    return c.json(
                        {
                            success: false,
                            error: 'Edge không được self-loop'
                        },
                        400
                    );
                }
            }

            // đảm bảo nodes và edges có id hợp lệ
            const validatedNodes = nodes.map((node: any) => ({
                ...node,
                id: node.id || uuidv4()
            }));

            const validatedEdges = edges.map((edge: any) => ({
                ...edge,
                id: edge.id || uuidv4()
            }));

            // trả về JSON roadmap (không lưu DB)
            // frontend sẽ dùng data này để gọi PUT /api/admin/roadmap để lưu vào DB
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
                console.log('glm api error:', errorText);
                return c.json(
                    {
                        success: false,
                        error: 'Gọi GLM API thất bại'
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
