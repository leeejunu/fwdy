"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { apiFetch } from "@/lib/api";
import { DEFAULT_CARGO_CALCULATION_SETTINGS, parseCargoCalculationSettings, type CargoCalculationSettings } from "@/lib/cargo-settings";
import { QUOTE_HISTORY_UPDATED } from "@/lib/quote-history";
import type { QuoteAnalysisRecord } from "@/lib/quote-analysis";

export default function Home() {
  const router = useRouter();
  const [shipper, setShipper] = useState("");
  const [consoleMail, setConsoleMail] = useState("");
  const [cargoSettings, setCargoSettings] = useState<CargoCalculationSettings>(DEFAULT_CARGO_CALCULATION_SETTINGS);
  const [ready, setReady] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setShipper(sessionStorage.getItem("forward:shipperMail") ?? "");
    setConsoleMail(sessionStorage.getItem("forward:consoleMail") ?? "");
    setCargoSettings(parseCargoCalculationSettings(sessionStorage.getItem("forward:cargoSettings")));
    setHasAnalysis(Boolean(sessionStorage.getItem("forward:analysis")));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem("forward:cargoSettings", JSON.stringify(cargoSettings));
  }, [cargoSettings, ready]);

  async function saveAndAnalyze() {
    if (analyzing || (!shipper.trim() && !consoleMail.trim())) return;
    setAnalyzing(true);
    setError("");
    try {
      const record = await apiFetch<QuoteAnalysisRecord>("/api/quote-analyses", {
        method: "POST",
        body: JSON.stringify({ shipperMail: shipper, consoleMail, cargoSettings: JSON.stringify(cargoSettings) }),
      });
      sessionStorage.setItem("forward:shipperMail", shipper);
      sessionStorage.setItem("forward:consoleMail", consoleMail);
      sessionStorage.setItem("forward:cargoSettings", JSON.stringify(cargoSettings));
      sessionStorage.setItem("forward:analysis", JSON.stringify(record.analysis));
      sessionStorage.setItem("forward:activeHistoryId", record.id);
      window.dispatchEvent(new Event(QUOTE_HISTORY_UPDATED));
      setHasAnalysis(true);
      router.push("/review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "메일 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  function invalidateAnalysis() {
    sessionStorage.removeItem("forward:analysis");
    setHasAnalysis(false);
  }

  return <WorkspaceShell><div className="page-wrap intake-page mx-auto w-full max-w-[1120px]">
    <div className="steps" aria-label="견적 진행 단계"><Link className="step active" href="/analysis" aria-current="step"><i>1</i> 메일 수집</Link><b />{ready && hasAnalysis && (shipper.trim() || consoleMail.trim()) ? <Link className="step done" href="/review"><i>✓</i> 추출 결과 검토</Link> : <button className="step step-disabled" type="button" disabled title="메일을 입력하고 분석을 완료하면 이동할 수 있어요."><i>2</i> 추출 결과 검토</button>}</div>
    <section className="intake-hero"><div className="eyebrow">NEW AIR FREIGHT QUOTE</div><h1>받은 메일부터 시작합니다.</h1><p>화주 요청과 콘솔사 회신을 각각 붙여 넣으면, 견적 검토에 필요한 내용을 한 번에 정리해요.</p></section>
    <section className="card intake-card" aria-busy={analyzing}>
      <div className="card-heading"><div><span className="section-index">01 <i>·</i> MAIL INPUT</span><h2>메일 원문 입력</h2><p>형식에 맞추지 않아도 괜찮아요. 받은 메일을 그대로 붙여 넣으세요.</p></div></div>
      <div className="mail-grid grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="mail-field"><span className="mail-label"><span><i className="label-dot shipper-dot" />화주 메일</span><small>화물 · 목적지 · 희망 일정</small></span><textarea value={shipper} onChange={e => { invalidateAnalysis(); setShipper(e.target.value); }} placeholder="화주에게 받은 메일 원문을 붙여 넣으세요." spellCheck={false} /><span className="field-foot">{shipper.length.toLocaleString()}자</span></label>
        <label className="mail-field"><span className="mail-label"><span><i className="label-dot console-dot" />콘솔사 메일</span><small>항공사 · 운임 · 스케줄</small></span><textarea value={consoleMail} onChange={e => { invalidateAnalysis(); setConsoleMail(e.target.value); }} placeholder="콘솔사 회신 메일을 붙여 넣으세요. 여러 건을 이어 붙여도 돼요." spellCheck={false} /><span className="field-foot">{consoleMail.length.toLocaleString()}자</span></label>
      </div>
      <div className="settings-grid cargo-settings-grid grid grid-cols-2 gap-2.5 md:grid-cols-4" role="group" aria-label="화물 계산 설정">
        <label><span>부피중량 나눗수</span><div className="input-unit"><input aria-label="부피중량 나눗수" type="text" inputMode="numeric" value={cargoSettings.volumeDivisor} onChange={event => setCargoSettings(current => ({ ...current, volumeDivisor: event.target.value.replace(/[^0-9]/g, "") }))}/><i>cm³/kg</i></div></label>
        <label><span>C/W 절상 단위</span><SelectWrap value={cargoSettings.roundUnit} onChange={value => setCargoSettings(current => ({ ...current, roundUnit: value as CargoCalculationSettings["roundUnit"] }))} ariaLabel="C/W 절상 단위"><option value="1">1 kg 단위 올림</option><option value="0.5">0.5 kg 단위 올림</option><option value="0.1">0.1 kg 단위 올림</option><option value="none">절상 안 함</option></SelectWrap></label>
        <label><span>Chargeable Weight 기준</span><SelectWrap value={cargoSettings.cwMethod} onChange={value => setCargoSettings(current => ({ ...current, cwMethod: value as CargoCalculationSettings["cwMethod"] }))} ariaLabel="Chargeable Weight 기준"><option value="max">G/W와 V/W 중 큰 값</option><option value="gross">G/W만 적용</option><option value="volume">V/W만 적용</option></SelectWrap></label>
        <label><span>적재 조건</span><SelectWrap value={cargoSettings.stackability} onChange={value => setCargoSettings(current => ({ ...current, stackability: value as CargoCalculationSettings["stackability"] }))} ariaLabel="적재 조건"><option value="from_mail">메일 내용에 따름</option><option value="stackable">다단 가능</option><option value="non_stackable">다단 불가</option></SelectWrap></label>
      </div>
      <div className="intake-bottom"><span>분석 완료 시 메일 원문과 설정, 추출 결과를 계정 이력에 저장합니다.</span><span>총 {(shipper.length + consoleMail.length).toLocaleString()}자</span></div>
      {error && <div className="api-error" role="alert">{error}</div>}
      <div className="intake-submit-row"><span>분석 요청 시 메일 원문이 설정된 AI API로 전송됩니다.</span><button className="button button-primary button-large" onClick={saveAndAnalyze} disabled={!ready || analyzing || (!shipper.trim() && !consoleMail.trim())}>{analyzing ? <><span className="analysis-button-spinner" aria-hidden="true"/> 분석 중…</> : <>메일 분석하기 <ArrowIcon /></>}</button></div>
    </section>
    <div className="privacy-note"><span className="privacy-icon">✦</span><div><strong>분석된 값은 다음 단계에서 직접 확인할 수 있어요.</strong><small>화물 치수와 중량, 운임 항목을 수정하면 예상 금액이 즉시 다시 계산됩니다.</small></div></div>
  </div></WorkspaceShell>;
}

function ArrowIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function SelectWrap({ value, onChange, ariaLabel, children }: { value: string; onChange: (value: string) => void; ariaLabel: string; children: React.ReactNode }) { return <div className="select-wrap"><select aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)}>{children}</select><svg className="select-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>; }
