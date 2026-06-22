"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  content: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  mode?: "preview" | "edit";
}

export function MarkdownEditor({
  content,
  onChange,
  readOnly = false,
  placeholder,
  mode: externalMode,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(content);
  const [internalMode, setInternalMode] = useState<"preview" | "edit">(readOnly ? "preview" : "preview");
  const mode = externalMode ?? internalMode;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(content);
  }, [content]);

  useEffect(() => {
    if (mode === "edit") textareaRef.current?.focus();
  }, [mode]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onChange?.(e.target.value);
  }

  const isEmpty = !value.trim();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Mode toggle — only shown when no external mode controller */}
      {!readOnly && !isEmpty && !externalMode && (
        <div className="absolute top-2 right-2 z-10 flex rounded-lg border border-bd bg-modal shadow-sm overflow-hidden">
          <button
            onClick={() => setInternalMode("preview")}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
              mode === "preview" ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"
            }`}
          >
            预览
          </button>
          <button
            onClick={() => setInternalMode("edit")}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
              mode === "edit" ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"
            }`}
          >
            编辑
          </button>
        </div>
      )}

      {(mode === "preview" && !isEmpty) ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 prose-md">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-bold text-t1 mb-2 mt-4 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold text-t1 mb-1.5 mt-4 first:mt-0 pb-1 border-b border-bd">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-t2 mb-1 mt-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-t2 leading-relaxed mb-2">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-t2 space-y-0.5 mb-2 pl-4 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm text-t2 space-y-0.5 mb-2 pl-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-t2 leading-relaxed">{children}</li>
              ),
              hr: () => <hr className="my-3 border-bd" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-t1">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-t2">{children}</em>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <code className="block bg-base border border-bd rounded-lg px-3 py-2 text-xs font-mono text-t2 whitespace-pre overflow-x-auto mb-2">
                    {children}
                  </code>
                ) : (
                  <code className="bg-surface2 rounded px-1 py-0.5 text-xs font-mono text-t2">
                    {children}
                  </code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-bd-hover pl-3 my-2 text-sm text-t2 italic">
                  {children}
                </blockquote>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt ?? ""}
                  className="max-w-full rounded-lg my-2 border border-bd"
                  loading="lazy"
                />
              ),
            }}
          >
            {value}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 resize-none p-4 text-sm font-mono text-t2 leading-relaxed outline-none bg-transparent placeholder:text-t4"
        />
      )}
    </div>
  );
}
