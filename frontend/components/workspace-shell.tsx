"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { QUOTE_HISTORY_UPDATED } from "@/lib/quote-history";
import type { QuoteAnalysisRecord, QuoteAnalysisSummary } from "@/lib/quote-analysis";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const review = pathname === "/review";
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unconfigured">("checking");
  const [accountName, setAccountName] = useState("FWDY");
  const [accountEmail, setAccountEmail] = useState("Google 계정");
  const [quoteHistory, setQuoteHistory] = useState<QuoteAnalysisSummary[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState("");
  const [openingHistoryId, setOpeningHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;
    const syncQuoteHistory = async () => {
      try {
        const entries = await apiFetch<QuoteAnalysisSummary[]>("/api/quote-analyses");
        if (!active) return;
        setQuoteHistory(entries);
        setActiveHistoryId(sessionStorage.getItem("forward:activeHistoryId"));
        setArchiveError("");
      } catch (error) {
        if (!active) return;
        setArchiveError(error instanceof Error ? error.message : "견적 이력을 불러오지 못했어요.");
      }
    };
    void syncQuoteHistory();
    window.addEventListener(QUOTE_HISTORY_UPDATED, syncQuoteHistory);
    return () => {
      active = false;
      window.removeEventListener(QUOTE_HISTORY_UPDATED, syncQuoteHistory);
    };
  }, [authStatus]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthStatus("unconfigured");
      return;
    }

    let active = true;
    getSupabaseBrowserClient().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setAccountName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "FWDY");
      setAccountEmail(data.user.email || "Google 계정");
      setAuthStatus("authenticated");
    }).catch(() => {
      if (active) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    });

    return () => { active = false; };
  }, [pathname, router]);

  async function signOut() {
    if (isSupabaseConfigured()) {
      try { await getSupabaseBrowserClient().auth.signOut(); } catch { /* continue to the sign-in page */ }
    }
    router.replace("/login");
  }

  function newTask() {
    sessionStorage.removeItem("forward:rawMail");
    sessionStorage.removeItem("forward:shipperMail");
    sessionStorage.removeItem("forward:consoleMail");
    sessionStorage.removeItem("forward:draftVersion");
    sessionStorage.removeItem("forward:analysis");
    sessionStorage.removeItem("forward:activeHistoryId");
    sessionStorage.removeItem("forward:rateOverrides");
    sessionStorage.removeItem("forward:quoteOverrides");
    Object.keys(sessionStorage).filter(key => key.startsWith("forward:pieceVolumes:")).forEach(key => sessionStorage.removeItem(key));
    window.dispatchEvent(new Event(QUOTE_HISTORY_UPDATED));
    router.push("/analysis");
  }

  async function openQuote(id: string) {
    if (openingHistoryId) return;
    setOpeningHistoryId(id);
    setArchiveError("");
    try {
      const record = await apiFetch<QuoteAnalysisRecord>(`/api/quote-analyses/${encodeURIComponent(id)}`);
      sessionStorage.setItem("forward:shipperMail", record.shipperMail);
      sessionStorage.setItem("forward:consoleMail", record.consoleMail);
      sessionStorage.setItem("forward:cargoSettings", record.cargoSettings);
      sessionStorage.setItem("forward:analysis", JSON.stringify(record.analysis));
      sessionStorage.setItem("forward:activeHistoryId", record.id);
      sessionStorage.removeItem("forward:quoteOverrides");
      Object.keys(sessionStorage)
        .filter(key => key.startsWith("forward:pieceVolumes:"))
        .forEach(key => sessionStorage.removeItem(key));
      setActiveHistoryId(record.id);
      router.push("/review");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "견적 기록을 불러오지 못했어요.");
    } finally {
      setOpeningHistoryId(null);
    }
  }

  const archiveGroups = groupQuoteHistory(quoteHistory);

  if (authStatus === "unconfigured") return <main className="auth-gate-page">
    <section><span className="auth-gate-icon">!</span><h1>로그인 설정이 필요해요</h1><p>Supabase URL과 Publishable Key를 설정하면 견적 화면을 사용할 수 있어요.</p><Link className="button button-primary" href="/login">로그인 설정 확인</Link></section>
  </main>;

  if (authStatus !== "authenticated") return <main className="auth-gate-page" aria-busy="true"><span className="login-spinner"/><p>로그인 상태를 확인하고 있어요.</p></main>;

  return <div className="workspace-app">
    <aside className="sidebar">
      <Link className="brand" href="/analysis" aria-label="FWDY 견적 화면으로 이동"><span className="brand-mark"><FwdyMark /></span><span className="brand-copy"><strong>FWDY</strong><small>Forward, made easy</small></span></Link>
      <button className="new-task" onClick={newTask}><span>＋</span> 새 견적 작업</button>
      <div className="side-caption archive-caption">ARCHIVE</div>
      {quoteHistory.length ? <div className="archive-list" aria-label="날짜별 최근 분석 견적">
        {archiveGroups.map(group => <section className="archive-date-group" key={group.key} aria-label={group.label}>
          <h3 className="archive-date-heading">{group.label}<span>{group.items.length}</span></h3>
          {group.items.map(quote => <button className={`archive-item ${activeHistoryId === quote.id ? "selected" : ""}`} key={quote.id} type="button" onClick={() => void openQuote(quote.id)} disabled={Boolean(openingHistoryId)} aria-current={activeHistoryId === quote.id ? "page" : undefined}>
            <span className="archive-item-dot" aria-hidden="true" />
            <span className="archive-item-copy"><strong>{quote.title}</strong><small>{quote.detail}</small></span>
            <time dateTime={validDateTime(quote.createdAt) ? quote.createdAt : undefined}>{formatArchiveTime(quote.createdAt)}</time>
          </button>)}
        </section>)}
      </div> : <div className="empty-archive">메일 분석을 완료하면 여기에 표시됩니다.</div>}
      {archiveError && <div className="archive-error" role="status">{archiveError}</div>}
      <div className="sidebar-bottom"><span className="avatar">{accountName.slice(0, 1).toUpperCase()}</span><span><strong>{accountName}</strong><small title={accountEmail}>{accountEmail}</small></span><button className="logout-button" onClick={signOut} aria-label="로그아웃" title="로그아웃"><LogoutIcon/></button></div>
    </aside>
    <div className="workspace-main">
      <main className={`workspace-content ${review ? "review-content" : "intake-content"}`}>{children}</main>
    </div>
  </div>;
}

function groupQuoteHistory(entries: QuoteAnalysisSummary[]) {
  const now = new Date();
  const todayKey = localDateKey(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = localDateKey(yesterday);
  const groups = new Map<string, { key: string; label: string; order: number; items: QuoteAnalysisSummary[] }>();

  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const isValidDate = !Number.isNaN(date.getTime());
    const key = isValidDate ? localDateKey(date) : "legacy";
    const label = !isValidDate
      ? "날짜 정보 없음"
      : key === todayKey
        ? "오늘"
        : key === yesterdayKey
          ? "어제"
          : date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const order = isValidDate ? date.getTime() : Number.NEGATIVE_INFINITY;
    const group = groups.get(key) ?? { key, label, order, items: [] };
    group.items.push(entry);
    groups.set(key, group);
  });

  return [...groups.values()].sort((a, b) => b.order - a.order);
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function formatArchiveTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function FwdyMark() { return <svg width="39" height="32" viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="fwdy-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="fwdy-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#fwdy-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#fwdy-mint)" strokeWidth="8" strokeLinecap="round"/></svg>; }
function LogoutIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>; }
