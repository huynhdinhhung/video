import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STYLE_PROMPTS: Record<string, string> = {
  nghiem_tuc: "Dịch sang tiếng Việt phong cách trang trọng, chính trị, báo chí. Sử dụng từ ngữ chuẩn mực.",
  ngau: "Dịch sang tiếng Việt phong cách 'cool ngầu', ngắn gọn, dứt khoát. Không dùng từ thừa, không 'ạ/nhé'.",
  de_thuong: "Dịch sang tiếng Việt phong cách dễ thương, thân thiện. Thêm từ ngữ biểu cảm như 'nha', 'ạ', 'hihi' ở cuối câu hợp lý.",
  chi_google: "Dịch sang tiếng Việt phong cách trung lập, như robot hoặc hệ thống thông báo.",
  hai_huoc: "Dịch sang tiếng Việt phong cách hài hước, dí dỏm, sử dụng từ ngữ cường điệu.",
};

export const translationService = {
  async translateSegments(segments: any[], targetLanguage: string, sourceLanguage?: string, style: string = "nghiem_tuc"): Promise<any[]> {
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.nghiem_tuc;
    const prompt = `${stylePrompt}
Dịch danh sách các đoạn văn bản sau sang ngôn ngữ mục tiêu: ${targetLanguage}.
Giữ nguyên cấu trúc JSON. Trả về mảng JSON chỉ chứa văn bản đã dịch.

Dữ liệu:
${JSON.stringify(segments.map(s => s.text))}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const translatedTexts = result.translations || result.data || Object.values(result)[0];

    return segments.map((seg, i) => ({
      ...seg,
      text: translatedTexts[i] || seg.text,
    }));
  },
};
