/**
 * useChatSimple — minimal chat hook, replaces @ai-sdk/react useChat.
 *
 * Why: ai SDK v6.0.208 has a bug in Chat.makeRequest where the finally
 * block accesses this.activeResponse!.state when activeResponse is undefined.
 * This cannot be fixed from outside the SDK. This hook replaces the entire
 * client-side chat state machine with ~100 lines.
 *
 * The server API (POST /api/projects/:id/chat) is UNCHANGED — it still uses
 * streamText + tools + createUIMessageStreamResponse. This hook reads the
 * same streaming response format.
 */

"use client";

import { useCallback, useRef, useState } from "react";

export interface SimpleMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{
    type: string;
    text?: string;
    toolName?: string;
    input?: unknown;
    state?: string;
    toolCallId?: string;
    args?: unknown;
    result?: unknown;
  }>;
  createdAt?: Date;
}

interface UseChatSimpleOptions {
  api: string;
  onError?: (err: Error) => void;
  onFinish?: (messages: SimpleMessage[]) => void;
}

let _msgId = 0;
function nextId(): string {
  return `msg_${++_msgId}_${Math.random().toString(36).slice(2, 6)}`;
}

export function useChatSimple({ api, onError, onFinish }: UseChatSimpleOptions) {
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMsg: { role: "user"; parts: Array<{ type: string; text?: string }> }) => {
    const userMessage: SimpleMessage = {
      id: nextId(),
      role: "user",
      parts: userMsg.parts.map(p => ({ ...p })),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const allMessages = [...messages, userMessage];
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const assistantMessage: SimpleMessage = {
        id: nextId(),
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          // Server sends SSE format: "data: {...}" — strip the prefix
          const json = line.startsWith("data: ") ? line.slice(6) : line;
          if (!json.trim()) continue;
          try {
            const chunk = JSON.parse(json);
            switch (chunk.type) {
            case "start":
            case "start-step":
            case "finish-step":
            case "reasoning-start":
            case "reasoning-end":
            case "text-start":
            case "text-end":
              // Metadata events — no action needed
              break;
            case "reasoning-delta":
              {
                const lastPart = assistantMessage.parts[assistantMessage.parts.length - 1];
                if (lastPart?.type === "reasoning") {
                  lastPart.text = (lastPart.text || "") + (chunk.delta || "");
                } else {
                  assistantMessage.parts.push({ type: "reasoning", text: chunk.delta || "" });
                }
              }
              break;
            case "text-delta": {
              // Append text and render immediately for streaming effect
              const last = assistantMessage.parts[assistantMessage.parts.length - 1];
              if (last?.type === "text") {
                last.text = (last.text || "") + (chunk.delta || "");
              } else {
                assistantMessage.parts.push({ type: "text", text: chunk.delta || "" });
              }
              setMessages(prev => {
                const copy = [...prev];
                const lastMsg = copy[copy.length - 1];
                if (lastMsg?.role === "assistant") {
                  copy[copy.length - 1] = { ...assistantMessage, parts: [...assistantMessage.parts] };
                } else {
                  copy.push({ ...assistantMessage, parts: [...assistantMessage.parts] });
                }
                return copy;
              });
              // Yield to React between text chunks for visible streaming
              await new Promise(r => setTimeout(r, 0));
              break;
            }
            case "tool-input-start":
              assistantMessage.parts.push({
                type: "tool-invocation", toolName: chunk.toolName || "",
                input: null, state: "call", toolCallId: chunk.toolCallId,
              });
              break;
            case "tool-input-delta":
              // Accumulate streaming tool input
              for (const p of assistantMessage.parts) {
                if (p.type === "tool-invocation" && p.toolCallId === chunk.toolCallId) {
                  const prevInput: string = typeof p.input === "string" ? p.input : "";
                  const newInput = prevInput + (chunk.inputTextDelta || "");
                  try { p.input = JSON.parse(newInput); } catch { p.input = newInput; }
                  break;
                }
              }
              break;
            case "tool-output-available":
              for (const p of assistantMessage.parts) {
                if (p.type === "tool-invocation" && p.toolCallId === chunk.toolCallId) {
                  p.state = "result";
                  try { p.result = typeof chunk.output === "string" ? JSON.parse(chunk.output) : chunk.output; } catch { p.result = chunk.output; }
                  break;
                }
              }
              break;
            case "finish":
              break;
            case "error":
              throw new Error(chunk.error || "Stream error");
            }
            // Batch update for non-text-delta events
            if (chunk.type !== "text-delta") {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant" && last.id === assistantMessage.id) {
                  copy[copy.length - 1] = { ...assistantMessage, parts: [...assistantMessage.parts] };
                } else {
                  copy.push({ ...assistantMessage, parts: [...assistantMessage.parts] });
                }
                return copy;
              });
            }
          } catch (e: any) {
            if (e.message?.includes("Stream error") || e.message?.includes("HTTP")) throw e;
            // JSON parse error on a line — skip it
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const json = buffer.startsWith("data: ") ? buffer.slice(6) : buffer;
          const chunk = JSON.parse(json);
          if (chunk.type === "text-delta") {
            const last = assistantMessage.parts[assistantMessage.parts.length - 1];
            if (last?.type === "text") {
              last.text = (last.text || "") + (chunk.delta || "");
            } else {
              assistantMessage.parts.push({ type: "text", text: chunk.delta || "" });
            }
          } else if (chunk.type === "finish") {
            // ignore
          }
        } catch { /* ignore malformed final line */ }
      }

      // Final update
      setMessages(prev => [...prev.filter(m => m.id !== assistantMessage.id), assistantMessage]);
      setIsLoading(false);
      onFinish?.([...messages, userMessage, assistantMessage]);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [messages, api, onError, onFinish]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const setMessages_ = useCallback((msgs: SimpleMessage[] | ((prev: SimpleMessage[]) => SimpleMessage[])) => {
    setMessages(msgs);
  }, []);

  return { messages, sendMessage, setMessages: setMessages_, isLoading, stop };
}
