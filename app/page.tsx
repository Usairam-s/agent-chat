"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";

type Message = {
  content: string;
  role: "user" | "assistant";
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"general" | "project">("general");
  const [loading, setLoading] = useState(false);

  // Load messages from Supabase on component mount and mode change
  useEffect(() => {
    const loadMessages = async () => {
      const tableName = mode === "general" ? "general_chats" : "project_chats";

      const { data, error } = await supabase
        .from(tableName)
        .select("content, role")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    loadMessages();
  }, [mode]); // Reload when mode changes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;

    setLoading(true);
    try {
      const newMessages = [...messages, { content: input, role: "user" }];
      //@ts-ignore
      setMessages(newMessages);
      setInput("");

      const response = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [
        ...prev,
        {
          content: data.replace(/\*\*/g, ""),
          role: "assistant",
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          content: `Error: ${error.message}`,
          role: "assistant",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode("general")}
          className={`p-2 ${
            mode === "general" ? "bg-yellow-500 text-white" : "bg-gray-500"
          }`}
        >
          General Chat
        </button>
        <button
          onClick={() => setMode("project")}
          className={`p-2 ${
            mode === "project" ? "bg-yellow-500 text-white" : "bg-gray-500"
          }`}
        >
          Project Planning
        </button>
      </div>

      <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}
          >
            <div
              className={`p-2 rounded-lg inline-block ${
                msg.role === "user" ? "bg-yellow-500" : "bg-gray-500"
              }`}
            >
              <div className="prose">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Processing...</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder={`Ask ${
            mode === "general" ? "general question" : "about your project"
          }...`}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 text-white p-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
