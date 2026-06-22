"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProjectErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project page error:", error);
  }, [error]);

  return (
    <div className="h-screen bg-base flex items-center justify-center">
      <div className="text-center max-w-sm">
        <p className="text-lg font-semibold text-t1 mb-2">页面出错</p>
        <p className="text-xs text-t2 mb-6">
          {error.message || "渲染项目页面时发生意外错误"}
        </p>
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={reset}
            className="rounded-xl bg-accent px-6 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            重试
          </button>
          <Link
            href="/projects"
            className="text-xs text-t3 hover:text-t2 underline"
          >
            返回项目列表
          </Link>
        </div>
      </div>
    </div>
  );
}
