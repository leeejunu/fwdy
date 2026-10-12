"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured, safeNextPath } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const started = useRef(false);
  const [message, setMessage] = useState("Google 로그인 정보를 확인하고 있어요.");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeSignIn() {
      if (!isSupabaseConfigured()) {
        setMessage("로그인 설정이 완료되지 않았어요.");
        setFailed(true);
        return;
      }

      const currentUrl = new URL(window.location.href);
      const providerError = currentUrl.searchParams.get("error_description") || currentUrl.searchParams.get("error");
      if (providerError) {
        setMessage("Google 로그인이 취소되었거나 완료되지 않았어요. 다시 시도해 주세요.");
        setFailed(true);
        return;
      }

      const code = currentUrl.searchParams.get("code");
      if (!code) {
        setMessage("로그인 확인 코드가 없어요. 다시 로그인해 주세요.");
        setFailed(true);
        return;
      }

      try {
        const { error } = await getSupabaseBrowserClient().auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("로그인을 완료하지 못했어요. 다시 로그인해 주세요.");
          setFailed(true);
          return;
        }
      } catch {
        setMessage("로그인을 완료하지 못했어요. 다시 로그인해 주세요.");
        setFailed(true);
        return;
      }

      window.location.replace(safeNextPath(currentUrl.searchParams.get("next")));
    }

    void completeSignIn();
  }, []);

  return <main className="login-page flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-10">
    <div className="login-background-glow" aria-hidden="true" />
    <section className="login-callback-card relative w-full max-w-[440px] rounded-[20px] border border-[#e8edf3] bg-white px-7 py-10 text-center shadow-[0_22px_70px_rgba(32,55,86,.09)] sm:px-10">
      {!failed && <span className="login-spinner" aria-hidden="true"/>}
      {failed && <span className="login-callback-error" aria-hidden="true">!</span>}
      <h1>{failed ? "로그인을 완료할 수 없어요" : "잠시만 기다려 주세요"}</h1>
      <p>{message}</p>
      {failed && <Link className="login-callback-link" href="/login">Google로 다시 로그인 <ArrowIcon/></Link>}
    </section>
  </main>;
}

function ArrowIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
