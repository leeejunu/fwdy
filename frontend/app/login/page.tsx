"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured, safeNextPath } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const isConfigured = isSupabaseConfigured();
    setConfigured(isConfigured);
    if (!isConfigured) {
      setChecking(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (data.user && !authError) {
        const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
        window.location.replace(next);
        return;
      }
      setChecking(false);
    }).catch(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, []);

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      setError("로그인 설정이 아직 완료되지 않았어요. 관리자에게 Supabase 환경 변수 설정을 요청해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);

    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: { prompt: "select_account" },
        },
      });

      if (!authError) return;
      setError("Google 로그인 연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setError("Google 로그인 연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page min-h-screen bg-[#f5f7fb] px-5 py-6 sm:px-8 sm:py-8">
    <div className="login-background-glow" aria-hidden="true" />
    <header className="relative mx-auto flex w-full max-w-[1120px] items-center justify-between">
      <Link href="/" className="login-brand flex items-center gap-2.5" aria-label="FWDY 홈"><FwdyMark/><span>FWDY</span></Link>
      <Link href="/" className="login-home-link">홈으로 돌아가기 <ArrowIcon/></Link>
    </header>

    <section className="login-layout relative mx-auto grid w-full max-w-[990px] items-center gap-10 py-12 md:min-h-[calc(100vh-110px)] md:grid-cols-[1fr_.9fr] md:gap-16 md:py-16">
      <div className="login-copy hidden md:block">
        <span className="login-kicker"><i/> FORWARD, MADE EASY</span>
        <h1>견적 업무에<br/>집중할 수 있도록,<br/><span>FWDY가 정리할게요.</span></h1>
        <p>흩어진 메일 속 화물 정보와 운임을<br/>한곳에서 확인하고 검토하세요.</p>
        <div className="login-benefits">
          <div><span><CheckIcon/></span><b>메일 원문 그대로 시작</b></div>
          <div><span><CheckIcon/></span><b>항목별 운임과 계산 근거 확인</b></div>
        </div>
        <div className="login-decor" aria-hidden="true"><span/><span/><span/></div>
      </div>

      <div className="login-card mx-auto w-full max-w-[420px] rounded-[20px] border border-[#e8edf3] bg-white px-6 py-8 shadow-[0_22px_70px_rgba(32,55,86,.09)] sm:px-9 sm:py-10">
        <div className="login-card-mark"><FwdyMark/></div>
        <p className="login-card-eyebrow">WELCOME TO FWDY</p>
        <h2>로그인하고 시작하세요</h2>
        <p className="login-card-description">Google 계정으로 안전하게 로그인할 수 있어요.</p>

        <button className="google-login-button" type="button" onClick={signInWithGoogle} disabled={loading || checking || !configured}>
          <GoogleIcon/>
          <span>{loading ? "Google로 연결 중…" : "Google로 계속하기"}</span>
          {!loading && <ArrowIcon/>}
        </button>

        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="login-divider"><span/> <small>Google 계정으로 간편하게</small> <span/></div>
        <p className="login-terms">계속 진행하면 FWDY의 서비스 이용에 동의하는 것으로 간주됩니다.</p>
      </div>
    </section>
    <footer className="login-footer mx-auto flex max-w-[1120px] items-center justify-between border-t border-[#e6ebf1] pt-5 text-[10px] text-[#98a2ae]"><span>© FWDY</span><span>Forward, made easy.</span></footer>
  </main>;
}

function FwdyMark() { return <svg width="34" height="28" viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="login-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="login-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#login-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#login-mint)" strokeWidth="8" strokeLinecap="round"/></svg>; }
function ArrowIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4.5 10.2 3.6 3.5 7.4-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function GoogleIcon() { return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.71 7.17l7.19 5.59c4.2-3.88 6.56-9.59 6.56-17.23Z"/><path fill="#FBBC05" d="M10.53 28.59A14.45 14.45 0 0 1 9.75 24c0-1.59.27-3.13.75-4.59l-7.98-6.2A23.93 23.93 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.78l-7.2-5.59c-1.99 1.35-4.54 2.15-8.7 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>; }
