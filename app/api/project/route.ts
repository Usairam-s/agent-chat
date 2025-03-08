import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Act as a project planning expert. Help me break down this project request: 
    ${messages[messages.length - 1].content}
    Provide detailed implementation steps and alternative approaches in plain text format.`;

    const result = await model.generateContent(prompt);
    const responseText = (await result.response.text())
      .replace(/\*\*/g, "")
      .replace(/#/g, "")
      .replace(/- /g, "• "); // Convert dashes to bullets

    await supabase.from("project_chats").insert([
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
