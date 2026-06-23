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

      const text = await res.text();
      const lines = text.split("\n").filter(Boolean);

      const assistantMessage: SimpleMessage = {
        id: nextId(),
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      for (const line of lines) {
        try {
          const chunk = JSON.parse(line);
          switch (chunk.type) {
            case "text-delta":
              // Append or create text part
              const lastTextPart = assistantMessage.parts[assistantMessage.parts.length - 1];
              if (lastTextPart?.type === "text") {
                lastTextPart.text = (lastTextPart.text || "") + (chunk.textDelta || "");
              } else {
                assistantMessage.parts.push({ type: "text", text: chunk.textDelta || "" });
              }
              break;
            case "tool-call":
              assistantMessage.parts.push({
                type: "tool-invocation",
                toolName: chunk.toolName || "",
                input: chunk.args || null,
                state: "call",
                toolCallId: chunk.toolCallId,
              });
              break;
            case "tool-result":
              // Update the matching tool-call part to "result" state
              for (const p of assistantMessage.parts) {
                if (p.type === "tool-invocation" && p.toolCallId === chunk.toolCallId) {
                  p.state = "result";
                  p.result = chunk.result;
                  break;
                }
              }
              break;
            case "finish":
              // Stream complete
              break;
            case "error":
              throw new Error(chunk.error || "Stream error");
          }
          // Update UI incrementally
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
        } catch (e: any) {
          if (e.message?.includes("Stream error") || e.message?.includes("HTTP")) throw e;
          // JSON parse error on a line — skip it
        }
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
