"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AdminState = "checking" | "unconfigured" | "signed-out" | "forbidden" | "admin";

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AdminState>("checking");
  const [name, setName] = useState("관리자");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("unconfigured");
      return;
    }

    let active = true;
    getSupabaseBrowserClient().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setState("signed-out");
        router.replace(`/login?next=${encodeURIComponent("/admin")}`);
        return;
      }

      setEmail(data.user.email ?? "");
      setName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "관리자");
      setState(data.user.app_metadata?.role === "admin" ? "admin" : "forbidden");
    }).catch(() => {
      if (active) setState("signed-out");
    });

    return () => { active = false; };
  }, [router]);

  async function signOut() {
    if (isSupabaseConfigured()) {
      try { await getSupabaseBrowserClient().auth.signOut(); } catch { /* continue to login */ }
    }
    router.replace("/login");
  }

  if (state !== "admin") {
    const messages: Record<Exclude<AdminState, "admin">, { title: string; body: string }> = {
      checking: { title: "관리자 권한을 확인하고 있어요", body: "잠시만 기다려 주세요." },
      unconfigured: { title: "로그인 설정이 필요해요", body: "Supabase URL과 Publishable Key를 설정한 뒤 다시 시도해 주세요." },
      "signed-out": { title: "로그인 화면으로 이동 중이에요", body: "관리자 페이지는 로그인 후 이용할 수 있어요." },
      forbidden: { title: "관리자 권한이 없어요", body: "관리자 계정으로 로그인하거나 Supabase 사용자 app_metadata에 role: admin을 설정해 주세요." },
    };
    const message = messages[state];
    return <main className="admin-gate min-h-screen px-5 py-10">
      <section className="admin-gate-card mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
        <Link href="/analysis" className="admin-brand mb-10" aria-label="FWDY 견적 화면으로">
          <FwdyMark /><span>FWDY</span>
        </Link>
        <span className="admin-gate-icon">{state === "checking" || state === "signed-out" ? <span className="login-spinner" /> : <ShieldIcon />}</span>
        <h1>{message.title}</h1>
        <p>{message.body}</p>
        {state === "forbidden" && email && <small className="admin-gate-email">현재 계정 · {email}</small>}
        <Link className="admin-return-link" href="/analysis">견적 화면으로 돌아가기 <ArrowIcon /></Link>
      </section>
    </main>;
  }

  return <div className="admin-layout min-h-screen">
    <aside className="admin-sidebar">
      <Link href="/analysis" className="admin-brand" aria-label="FWDY 견적 화면으로"><FwdyMark /><span>FWDY</span></Link>
      <div className="admin-sidebar-label">WORKSPACE</div>
      <Link href="/analysis" className="admin-side-link"><span className="admin-side-icon"><QuoteIcon /></span>견적 워크스페이스<ArrowIcon /></Link>
      <div className="admin-sidebar-label admin-sidebar-label-spaced">ADMIN</div>
      <a href="#overview" className="admin-side-link active"><span className="admin-side-icon"><GridIcon /></span>개요</a>
      <a href="#management" className="admin-side-link"><span className="admin-side-icon"><ManageIcon /></span>관리 기능</a>
      <div className="admin-sidebar-bottom">
        <span className="admin-avatar">{name.slice(0, 1).toUpperCase()}</span>
        <span className="admin-account"><strong>{name}</strong><small title={email}>{email}</small></span>
        <button type="button" className="admin-signout" onClick={signOut} aria-label="로그아웃" title="로그아웃"><LogoutIcon /></button>
      </div>
    </aside>

    <main className="admin-main" id="overview">
      <header className="admin-topbar"><div><span className="admin-breadcrumb">FWDY <i>/</i> ADMIN</span></div><span className="admin-role-pill"><i /> 관리자</span></header>
      <div className="admin-content">
        <section className="admin-page-heading">
          <div><span className="admin-eyebrow">FWDY CONTROL CENTER</span><h1>관리자 콘솔</h1><p>서비스 운영을 위한 관리 기능을 한곳에서 확인하세요.</p></div>
          <span className="admin-heading-mark"><ManageIcon /></span>
        </section>

        <section className="admin-notice" role="status">
          <span className="admin-notice-icon"><InfoIcon /></span>
          <div><strong>관리 기능을 연결할 준비가 되었어요</strong><p>현재 관리자 화면의 기반을 만들었어요. 회원·분석 데이터는 관리자 API 연결 후 표시됩니다.</p></div>
          <span className="admin-notice-tag">API 연결 대기</span>
        </section>

        <section className="admin-section" id="management">
          <div className="admin-section-heading"><div><span className="admin-eyebrow">MANAGEMENT</span><h2>관리 기능</h2></div><span>준비 중인 항목</span></div>
          <div className="admin-module-grid">
            <article className="admin-module-card">
              <span className="admin-module-icon blue"><UsersIcon /></span>
              <div className="admin-module-copy"><h3>회원 관리</h3><p>가입 계정과 서비스 접근 상태를 관리합니다.</p></div>
              <span className="admin-module-status">준비 중</span>
            </article>
            <article className="admin-module-card">
              <span className="admin-module-icon mint"><DocumentIcon /></span>
              <div className="admin-module-copy"><h3>분석 내역</h3><p>메일 분석 요청과 처리 결과를 확인합니다.</p></div>
              <span className="admin-module-status">준비 중</span>
            </article>
            <article className="admin-module-card">
              <span className="admin-module-icon violet"><SettingsIcon /></span>
              <div className="admin-module-copy"><h3>서비스 설정</h3><p>운영 환경과 서비스 기본 설정을 관리합니다.</p></div>
              <span className="admin-module-status">준비 중</span>
            </article>
          </div>
        </section>

        <footer className="admin-footer"><span>FWDY ADMIN</span><span>관리자 권한으로 로그인됨 · {email}</span></footer>
      </div>
    </main>
  </div>;
}

function FwdyMark() { return <svg width="32" height="26" viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="admin-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="admin-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#admin-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#admin-mint)" strokeWidth="8" strokeLinecap="round"/></svg>; }
function ArrowIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function ShieldIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 20 6v5c0 5.1-3.4 8.5-8 10-4.6-1.5-8-4.9-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>; }
function GridIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>; }
function ManageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16M4 12h10M4 19h7"/><circle cx="18" cy="12" r="2"/><circle cx="15" cy="19" r="2"/></svg>; }
function QuoteIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="19" cy="19" r="2"/></svg>; }
function UsersIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function DocumentIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.8Z" transform="translate(-1 -1)"/></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>; }
function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>; }
