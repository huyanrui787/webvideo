"use client";

import { useActionState } from "react";
import { loginAction } from "./actions/login";

export function LoginFormSafer() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {state?.error && (
        <p style={{ color: "#f87171", fontSize: "13px", textAlign: "center", margin: 0 }}>
          {state.error}
        </p>
      )}

      <div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: "0 0 6px 0" }}>邮箱</p>
        <input
          name="email"
          type="email"
          defaultValue="a@a.com"
          required
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)", color: "#fff",
            fontSize: "14px", outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      <div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: "0 0 6px 0" }}>密码</p>
        <input
          name="password"
          type="password"
          defaultValue="123456"
          required
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)", color: "#fff",
            fontSize: "14px", outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      <input type="hidden" name="next" value="/studio" />

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%", padding: "12px", borderRadius: "12px",
          border: "none", fontSize: "15px", fontWeight: 600,
          background: pending ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.92)",
          color: "#0a0a0c", cursor: pending ? "not-allowed" : "pointer",
          marginTop: "4px"
        }}
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
