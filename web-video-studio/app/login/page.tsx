import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base flex items-center justify-center text-sm text-t2">加载中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
