"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { QUOTE_ANALYSIS_SELECTED, QUOTE_HISTORY_UPDATED } from "@/lib/quote-history";
import type { QuoteAnalysisRecord, QuoteAnalysisSummary } from "@/lib/quote-analysis";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const review = pathname === "/review";
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unconfigured">("checking");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountName, setAccountName] = useState("FWDY");
  const [accountEmail, setAccountEmail] = useState("Google 계정");
  const [quoteHistory, setQuoteHistory] = useState<QuoteAnalysisSummary[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState("");
  const [openingHistoryId, setOpeningHistoryId] = useState<string | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [openArchiveMenuId, setOpenArchiveMenuId] = useState<string | null>(null);
  const [archiveMenuPosition, setArchiveMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem("forward:sidebarCollapsed") === "true");
  }, []);

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

  useEffect(() => {
    if (!openArchiveMenuId) return;
    const closeMenu = () => {
      setOpenArchiveMenuId(null);
      setArchiveMenuPosition(null);
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(".archive-item-actions")) closeMenu();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openArchiveMenuId]);

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
    setActiveHistoryId(null);
    sessionStorage.removeItem("forward:rateOverrides");
    sessionStorage.removeItem("forward:quoteOverrides");
    Object.keys(sessionStorage).filter(key => key.startsWith("forward:pieceVolumes:")).forEach(key => sessionStorage.removeItem(key));
    window.dispatchEvent(new Event(QUOTE_HISTORY_UPDATED));
    router.push("/analysis");
  }

  function toggleSidebar() {
    setSidebarCollapsed(current => {
      const next = !current;
      localStorage.setItem("forward:sidebarCollapsed", String(next));
      return next;
    });
  }

  async function openQuote(id: string) {
    if (openingHistoryId) return;
    setOpenArchiveMenuId(null);
    setArchiveMenuPosition(null);
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
      window.dispatchEvent(new Event(QUOTE_ANALYSIS_SELECTED));
      router.push("/review");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "견적 기록을 불러오지 못했어요.");
    } finally {
      setOpeningHistoryId(null);
    }
  }

  async function deleteQuote(id: string, title: string) {
    if (deletingHistoryId || openingHistoryId) return;
    setOpenArchiveMenuId(null);
    setArchiveMenuPosition(null);
    if (!window.confirm(`“${title}” 견적을 삭제할까요?\n삭제한 메일과 분석 기록은 복구할 수 없습니다.`)) return;

    setDeletingHistoryId(id);
    setArchiveError("");
    try {
      await apiFetch<void>(`/api/quote-analyses/${encodeURIComponent(id)}`, { method: "DELETE" });
      setQuoteHistory(current => current.filter(quote => quote.id !== id));
      if (activeHistoryId === id) newTask();
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "견적 기록을 삭제하지 못했어요.");
    } finally {
      setDeletingHistoryId(null);
    }
  }

  const archiveGroups = groupQuoteHistory(quoteHistory);

  if (authStatus === "unconfigured") return <main className="auth-gate-page">
    <section><span className="auth-gate-icon">!</span><h1>로그인 설정이 필요해요</h1><p>Supabase URL과 Publishable Key를 설정하면 견적 화면을 사용할 수 있어요.</p><Link className="button button-primary" href="/login">로그인 설정 확인</Link></section>
  </main>;

  if (authStatus !== "authenticated") return <main className="auth-gate-page" aria-busy="true"><span className="login-spinner"/><p>로그인 상태를 확인하고 있어요.</p></main>;

  return <div className={`workspace-app ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
    <aside id="workspace-sidebar" className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-header">
        <Link className="brand" href="/analysis" aria-label="FWDY 견적 화면으로 이동"><span className="brand-mark"><FwdyMark /></span><span className="brand-copy"><strong>FWDY</strong><small>Forward, made easy</small></span></Link>
        <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"} aria-expanded={!sidebarCollapsed} aria-controls="workspace-sidebar" title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}>
          <SidebarToggleIcon />
        </button>
      </div>
      <button className="new-task" onClick={newTask} title="새 견적 작업"><span>＋</span><span className="new-task-label">새 견적 작업</span></button>
      <div className="side-caption archive-caption">ARCHIVE</div>
      {quoteHistory.length ? <div className="archive-list" aria-label="날짜별 최근 분석 견적">
        {archiveGroups.map(group => <section className="archive-date-group" key={group.key} aria-label={group.label}>
          <h3 className="archive-date-heading">{group.label}<span>{group.items.length}</span></h3>
          {group.items.map(quote => <div className={`archive-item ${activeHistoryId === quote.id ? "selected" : ""}`} key={quote.id}>
            <button className="archive-item-open" type="button" onClick={() => void openQuote(quote.id)} disabled={Boolean(openingHistoryId) || deletingHistoryId === quote.id} aria-current={activeHistoryId === quote.id ? "page" : undefined} title={quote.title}>
              <span className="archive-item-dot" aria-hidden="true" />
              <span className="archive-item-copy"><strong>{quote.title}</strong><small>{quote.detail}</small></span>
            </button>
            <div className="archive-item-actions">
              <button className="archive-item-more" type="button" onClick={event => {
                if (openArchiveMenuId === quote.id) {
                  setOpenArchiveMenuId(null);
                  setArchiveMenuPosition(null);
                  return;
                }
                const bounds = event.currentTarget.getBoundingClientRect();
                const menuWidth = 112;
                const menuHeight = 44;
                setArchiveMenuPosition({
                  top: Math.min(bounds.bottom + 5, window.innerHeight - menuHeight - 8),
                  left: Math.min(bounds.left, window.innerWidth - menuWidth - 8),
                });
                setOpenArchiveMenuId(quote.id);
              }} disabled={Boolean(openingHistoryId) || Boolean(deletingHistoryId)} aria-label={`${quote.title} 메뉴`} aria-haspopup="menu" aria-expanded={openArchiveMenuId === quote.id}>···</button>
              {openArchiveMenuId === quote.id && archiveMenuPosition && <div className="archive-item-menu" style={archiveMenuPosition} role="menu">
                <button className="archive-item-delete" type="button" role="menuitem" onClick={() => void deleteQuote(quote.id, quote.title)} disabled={Boolean(openingHistoryId) || Boolean(deletingHistoryId)}>
                  {deletingHistoryId === quote.id ? "삭제 중…" : "삭제"}
                </button>
              </div>}
            </div>
          </div>)}
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

function FwdyMark() { return <svg width="39" height="32" viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="fwdy-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="fwdy-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#fwdy-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#fwdy-mint)" strokeWidth="8" strokeLinecap="round"/></svg>; }
function SidebarToggleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 18-6-6 6-6"/><path d="M20 5v14"/></svg>; }
function LogoutIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>; }
