import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import axios from 'axios';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = new Hono();

const genQuizSchema = z.object({
    topic_id: z.uuid(),
    prompt: z.string().optional()
});

app.post('/', zValidator('json', genQuizSchema), async (c) => {
    try {
        const { topic_id, prompt } = c.req.valid('json');

        const topic = await prisma.topic.findUnique({
            where: { id: topic_id }
        });

        if (!topic) {
            return c.json(
                {
                    success: false,
                    error: 'Topic không tồn tại'
                },
                404
            );
        }

        try {
            const response = await axios.post(
                'https://api.ovfteam.com',
                {
                    messages: [
                        {
                            role: 'system',
                            content: `Bạn là chuyên gia tạo câu hỏi quiz CHẤT LƯỢNG CAO và PHÙ HỢP với chủ đề. Nhiệm vụ của bạn là tạo quiz JSON hoàn chỉnh theo format chuẩn.

QUAN TRỌNG: Bạn PHẢI trả về JSON thuần, không có markdown code block, không có giải thích thêm. Chỉ trả về JSON object.

MỤC TIÊU: Tạo quiz CHẤT LƯỢNG CAO, PHÙ HỢP với chủ đề, giúp người học kiểm tra và củng cố kiến thức. Quiz phải:
- Câu hỏi rõ ràng, dễ hiểu, liên quan trực tiếp đến chủ đề
- 4 đáp án, trong đó chỉ có 1 đáp án đúng
- Các đáp án sai phải hợp lý, có tính đánh lừa nhưng không quá khó
- Độ khó phù hợp với người đã học qua chủ đề này

JSON Schema format:
{
  "type": "object",
  "properties": {
    "label": { "type": "string", "maxLength": 200 },
    "content": { "type": "string" },
    "options": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "content": { "type": "string" },
          "is_correct": { "type": "boolean" }
        },
        "required": ["content", "is_correct"]
      },
      "minItems": 4,
      "maxItems": 4
    }
  },
  "required": ["label", "content", "options"]
}

YÊU CẦU CHI TIẾT:

1. Label (BẮT BUỘC):
   - string tiếng Việt, tiêu đề câu hỏi NGẮN GỌN, RÕ RÀNG
   - Tối đa 200 ký tự
   - Phải thể hiện được nội dung chính của câu hỏi

2. Content (BẮT BUỘC):
   - string tiếng Việt, NỘI DUNG CÂU HỎI CHI TIẾT
   - Giải thích rõ ràng câu hỏi đang hỏi gì
   - Có thể bao gồm ngữ cảnh, ví dụ, hoặc thông tin cần thiết
   - Phải đủ chi tiết để người học hiểu rõ câu hỏi

3. Options (BẮT BUỘC - PHẢI CÓ ĐÚNG 4 OPTIONS):
   - Mỗi option là object có:
     * content: string tiếng Việt, nội dung đáp án (bắt buộc)
     * is_correct: boolean, true nếu là đáp án đúng, false nếu là đáp án sai (bắt buộc)
   - PHẢI CÓ ĐÚNG 1 OPTION có is_correct = true
   - PHẢI CÓ ĐÚNG 3 OPTIONS có is_correct = false
   - Các đáp án sai phải:
     * Hợp lý, có vẻ đúng nhưng thực tế sai
     * Không quá dễ đoán (không phải câu trả lời vô lý)
     * Giúp người học suy nghĩ và phân tích
   - Đáp án đúng phải chính xác, rõ ràng

4. Chất lượng:
   - Câu hỏi phải liên quan trực tiếp đến chủ đề được yêu cầu
   - Độ khó phù hợp: không quá dễ, không quá khó
   - Giúp người học củng cố kiến thức quan trọng
   - Câu hỏi và đáp án phải chính xác về mặt kỹ thuật

Ví dụ structure:
{
  "label": "Câu hỏi về khái niệm cơ bản",
  "content": "Trong lập trình, biến (variable) là gì? Hãy chọn đáp án đúng nhất.",
  "options": [
    {
      "content": "Biến là một giá trị cố định không thể thay đổi",
      "is_correct": false
    },
    {
      "content": "Biến là một vùng nhớ được đặt tên để lưu trữ dữ liệu có thể thay đổi",
      "is_correct": true
    },
    {
      "content": "Biến là một hàm để thực hiện tính toán",
      "is_correct": false
    },
    {
      "content": "Biến là một cấu trúc dữ liệu phức tạp",
      "is_correct": false
    }
  ]
}`
                        },
                        {
                            role: 'user',
                            content: (() => {
                                const promptPart = prompt ? `\n\nYêu cầu cụ thể: ${prompt}` : '';
                                return `Tạo quiz CHẤT LƯỢNG CAO về chủ đề: "${topic.name}".${promptPart}

YÊU CẦU ĐẶC BIỆT:
- Quiz phải liên quan trực tiếp đến chủ đề "${topic.name}"
- Câu hỏi rõ ràng, dễ hiểu, giúp kiểm tra kiến thức quan trọng
- Đúng 4 đáp án, trong đó chỉ có 1 đáp án đúng
- Các đáp án sai phải hợp lý, có tính đánh lừa nhưng không quá khó
- Độ khó phù hợp với người đã học qua chủ đề này`;
                            })()
                        }
                    ],
                    thinking: {
                        type: 'disabled'
                    },
                    temperature: 0.7,
                    max_tokens: 2048,
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

            let quizJson: any;
            try {
                quizJson = JSON.parse(aiContent);
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

            const { label, content, options } = quizJson;

            if (!label || typeof label !== 'string') {
                return c.json(
                    {
                        success: false,
                        error: 'Format quiz từ AI không hợp lệ: thiếu label hoặc label không phải string'
                    },
                    400
                );
            }

            if (label.length > 200) {
                return c.json(
                    {
                        success: false,
                        error: `Format quiz từ AI không hợp lệ: label quá dài (${label.length} ký tự, tối đa 200)`
                    },
                    400
                );
            }

            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                return c.json(
                    {
                        success: false,
                        error: 'Format quiz từ AI không hợp lệ: thiếu content hoặc content rỗng'
                    },
                    400
                );
            }

            if (!Array.isArray(options)) {
                return c.json(
                    {
                        success: false,
                        error: 'Format quiz từ AI không hợp lệ: options phải là array'
                    },
                    400
                );
            }

            if (options.length !== 4) {
                return c.json(
                    {
                        success: false,
                        error: `Format quiz từ AI không hợp lệ: phải có đúng 4 options, hiện tại có ${options.length}`
                    },
                    400
                );
            }

            const correctOptions = options.filter((opt: any) => opt.is_correct === true);
            if (correctOptions.length !== 1) {
                return c.json(
                    {
                        success: false,
                        error: `Format quiz từ AI không hợp lệ: phải có đúng 1 đáp án đúng, hiện tại có ${correctOptions.length}`
                    },
                    400
                );
            }

            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (!option.content || typeof option.content !== 'string' || option.content.trim().length === 0) {
                    return c.json(
                        {
                            success: false,
                            error: `Option ${i} thiếu content hoặc content rỗng`
                        },
                        400
                    );
                }
                if (typeof option.is_correct !== 'boolean') {
                    return c.json(
                        {
                            success: false,
                            error: `Option ${i} is_correct phải là boolean`
                        },
                        400
                    );
                }
            }

            const validatedOptions = options.map((option: any) => ({
                id: uuidv4(),
                content: option.content.trim(),
                is_correct: option.is_correct
            }));

            return c.json(
                {
                    success: true,
                    data: {
                        label: label.trim(),
                        content: content.trim(),
                        topic_id,
                        options: validatedOptions
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
        console.log('gen quiz error:', error);
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
