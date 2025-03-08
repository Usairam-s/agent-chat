import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = messages[messages.length - 1].content;
    const result = await model.generateContent(`
      Provide response in plain text format without markdown.
      Keep paragraphs short and use line breaks for readability.
      Question: ${prompt}
    `);

    const responseText = (await result.response.text())
      .replace(/\*\*/g, "") // Remove bold formatting
      .replace(/#/g, ""); // Remove headers

    await supabase.from("general_chats").insert([
      { content: prompt, role: "user" },
      { content: responseText, role: "assistant" },
    ]);

    return Response.json(responseText);
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
