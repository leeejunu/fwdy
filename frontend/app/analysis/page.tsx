"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { apiFetch } from "@/lib/api";
import { uploadMailImage, deleteMailImages } from "@/lib/mail-images";
import { DEFAULT_CARGO_CALCULATION_SETTINGS, parseCargoCalculationSettings, type CargoCalculationSettings } from "@/lib/cargo-settings";
import { QUOTE_HISTORY_UPDATED } from "@/lib/quote-history";
import type { QuoteAnalysisRecord } from "@/lib/quote-analysis";

export default function Home() {
  const router = useRouter();
  const [shipper, setShipper] = useState("");
  const [consoleMail, setConsoleMail] = useState("");
  const [shipperImage, setShipperImage] = useState("");
  const [consoleImage, setConsoleImage] = useState("");
  const [shipperMode, setShipperMode] = useState<"text" | "image">("text");
  const [consoleMode, setConsoleMode] = useState<"text" | "image">("text");
  const [cargoSettings, setCargoSettings] = useState<CargoCalculationSettings>(DEFAULT_CARGO_CALCULATION_SETTINGS);
  const [ready, setReady] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedShipper = sessionStorage.getItem("forward:shipperMail") ?? "";
    const savedConsole = sessionStorage.getItem("forward:consoleMail") ?? "";
    if (savedShipper.startsWith("data:image/")) {
      setShipperImage(savedShipper);
      setShipperMode("image");
    } else setShipper(savedShipper);
    if (savedConsole.startsWith("data:image/")) {
      setConsoleImage(savedConsole);
      setConsoleMode("image");
    } else setConsoleMail(savedConsole);
    setCargoSettings(parseCargoCalculationSettings(sessionStorage.getItem("forward:cargoSettings")));
    setHasAnalysis(Boolean(sessionStorage.getItem("forward:analysis")));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) sessionStorage.setItem("forward:cargoSettings", JSON.stringify(cargoSettings));
  }, [cargoSettings, ready]);

  async function saveAndAnalyze() {
    const shipperInput = shipperMode === "image" ? shipperImage : shipper;
    const consoleInput = consoleMode === "image" ? consoleImage : consoleMail;
    if (analyzing || (!shipperInput.trim() && !consoleInput.trim())) return;
    setAnalyzing(true);
    setError("");
    const uploadedPaths: string[] = [];
    try {
      const shipperImagePath = shipperMode === "image" ? await uploadMailImage(shipperInput, "shipper") : null;
      if (shipperImagePath) uploadedPaths.push(shipperImagePath);
      const consoleImagePath = consoleMode === "image" ? await uploadMailImage(consoleInput, "console") : null;
      if (consoleImagePath) uploadedPaths.push(consoleImagePath);
      const record = await apiFetch<QuoteAnalysisRecord>("/api/quote-analyses", {
        method: "POST",
        body: JSON.stringify({ shipperMail: shipperInput, consoleMail: consoleInput, shipperImagePath, consoleImagePath, cargoSettings: JSON.stringify(cargoSettings) }),
      });
      sessionStorage.setItem("forward:shipperMail", shipperInput);
      sessionStorage.setItem("forward:consoleMail", consoleInput);
      sessionStorage.setItem("forward:cargoSettings", JSON.stringify(cargoSettings));
      sessionStorage.setItem("forward:analysis", JSON.stringify(record.analysis));
      sessionStorage.setItem("forward:activeHistoryId", record.id);
      window.dispatchEvent(new Event(QUOTE_HISTORY_UPDATED));
      setHasAnalysis(true);
      router.push("/review");
    } catch (cause) {
      try { await deleteMailImages(uploadedPaths); } catch { /* leave an orphan rather than hide the analysis error */ }
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
    <div className="steps" aria-label="견적 진행 단계"><Link className="step active" href="/analysis" aria-current="step"><i>1</i> 메일 수집</Link><b />{ready && hasAnalysis && (shipper.trim() || consoleMail.trim() || shipperImage || consoleImage) ? <Link className="step done" href="/review"><i>✓</i> 추출 결과 검토</Link> : <button className="step step-disabled" type="button" disabled title="메일을 입력하고 분석을 완료하면 이동할 수 있어요."><i>2</i> 추출 결과 검토</button>}</div>
    <section className="intake-hero"><div className="eyebrow">NEW AIR FREIGHT QUOTE</div><h1>받은 메일부터 시작합니다.</h1><p>화주 요청과 콘솔사 회신을 각각 붙여 넣으면, 견적 검토에 필요한 내용을 한 번에 정리해요.</p></section>
    <section className="card intake-card" aria-busy={analyzing}>
      <div className="card-heading"><div><span className="section-index">01 <i>·</i> MAIL INPUT</span><h2>메일 원문 입력</h2><p>형식에 맞추지 않아도 괜찮아요. 받은 메일을 그대로 붙여 넣으세요.</p></div></div>
      <div className="mail-grid grid grid-cols-1 gap-4 md:grid-cols-2">
        <MailInputField id="shipper" title="화주 메일" hint="화물 · 목적지 · 희망 일정" placeholder="화주에게 받은 메일 원문을 붙여 넣으세요." mode={shipperMode} setMode={setShipperMode} text={shipper} setText={setShipper} image={shipperImage} setImage={setShipperImage} invalidateAnalysis={invalidateAnalysis} />
        <MailInputField id="console" title="콘솔사 메일" hint="항공사 · 운임 · 스케줄" placeholder="콘솔사 회신 메일을 붙여 넣으세요. 여러 건을 이어 붙여도 돼요." mode={consoleMode} setMode={setConsoleMode} text={consoleMail} setText={setConsoleMail} image={consoleImage} setImage={setConsoleImage} invalidateAnalysis={invalidateAnalysis} />
      </div>
      <div className="settings-grid cargo-settings-grid grid grid-cols-2 gap-2.5 md:grid-cols-4" role="group" aria-label="화물 계산 설정">
        <label><span>부피중량 나눗수</span><div className="input-unit"><input aria-label="부피중량 나눗수" type="text" inputMode="numeric" value={cargoSettings.volumeDivisor} onChange={event => setCargoSettings(current => ({ ...current, volumeDivisor: event.target.value.replace(/[^0-9]/g, "") }))}/><i>cm³/kg</i></div></label>
        <label><span>C/W 절상 단위</span><SelectWrap value={cargoSettings.roundUnit} onChange={value => setCargoSettings(current => ({ ...current, roundUnit: value as CargoCalculationSettings["roundUnit"] }))} ariaLabel="C/W 절상 단위"><option value="1">1 kg 단위 올림</option><option value="0.5">0.5 kg 단위 올림</option><option value="0.1">0.1 kg 단위 올림</option><option value="none">절상 안 함</option></SelectWrap></label>
        <label><span>Chargeable Weight 기준</span><SelectWrap value={cargoSettings.cwMethod} onChange={value => setCargoSettings(current => ({ ...current, cwMethod: value as CargoCalculationSettings["cwMethod"] }))} ariaLabel="Chargeable Weight 기준"><option value="max">G/W와 V/W 중 큰 값</option><option value="gross">G/W만 적용</option><option value="volume">V/W만 적용</option></SelectWrap></label>
        <label><span>적재 조건</span><SelectWrap value={cargoSettings.stackability} onChange={value => setCargoSettings(current => ({ ...current, stackability: value as CargoCalculationSettings["stackability"] }))} ariaLabel="적재 조건"><option value="from_mail">메일 내용에 따름</option><option value="stackable">다단 가능</option><option value="non_stackable">다단 불가</option></SelectWrap></label>
        <label><span>THC 금액 <small>(직접 입력 · 비우면 메일 값)</small></span><div className="input-unit"><input aria-label="THC 금액" type="number" min="0" step="any" placeholder="메일 값 사용" value={cargoSettings.thcAmount} onChange={event => setCargoSettings(current => ({ ...current, thcAmount: event.target.value }))}/><i>KRW</i></div></label>
        <label><span>THC 적용 기준</span><SelectWrap value={cargoSettings.thcBasis} onChange={value => setCargoSettings(current => ({ ...current, thcBasis: value as CargoCalculationSettings["thcBasis"] }))} ariaLabel="THC 적용 기준"><option value="bl">B/L당</option><option value="awb">AWB당</option><option value="kg">kg당</option><option value="rt">RT당 (CBM/톤 중 큰 값)</option><option value="shipment">건당 고정</option></SelectWrap></label>
      </div>
      <div className="intake-bottom"><span>분석 완료 시 메일 원문과 설정, 추출 결과를 계정 이력에 저장합니다.</span><span>텍스트 {(shipper.length + consoleMail.length).toLocaleString()}자 · 이미지 {(shipperMode === "image" && shipperImage ? 1 : 0) + (consoleMode === "image" && consoleImage ? 1 : 0)}장</span></div>
      {error && <div className="api-error" role="alert">{error}</div>}
      <div className="intake-submit-row"><span>분석 요청 시 텍스트와 첨부 이미지가 AI API로 전송됩니다.</span><button className="button button-primary button-large" onClick={saveAndAnalyze} disabled={!ready || analyzing || (!(shipperMode === "image" ? shipperImage : shipper.trim()) && !(consoleMode === "image" ? consoleImage : consoleMail.trim()))}>{analyzing ? <><span className="analysis-button-spinner" aria-hidden="true"/> 분석 중…</> : <>메일 분석하기 <ArrowIcon /></>}</button></div>
    </section>
  </div></WorkspaceShell>;
}

function MailInputField({ id, title, hint, placeholder, mode, setMode, text, setText, image, setImage, invalidateAnalysis }: {
  id: "shipper" | "console"; title: string; hint: string; placeholder: string;
  mode: "text" | "image"; setMode: (mode: "text" | "image") => void;
  text: string; setText: (text: string) => void; image: string; setImage: (image: string) => void;
  invalidateAnalysis: () => void;
}) {
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function selectImage(file?: File) {
    if (!file) return;
    setUploadError("");
    try {
      const dataUrl = await compressMailImage(file);
      setImage(dataUrl);
      setMode("image");
      setText("");
      invalidateAnalysis();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "이미지를 불러오지 못했어요.");
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void selectImage(file);
  }

  return <div className="mail-field">
    <div className="mail-label"><span><i className={`label-dot ${id === "shipper" ? "shipper-dot" : "console-dot"}`} />{title}</span><small>{hint}</small></div>
    <div className="mail-input-tabs" role="group" aria-label={`${title} 입력 방식`}>
      <button type="button" className={mode === "text" ? "active" : ""} aria-pressed={mode === "text"} onClick={() => { setMode("text"); setUploadError(""); invalidateAnalysis(); }}>텍스트</button>
      <button type="button" className={mode === "image" ? "active" : ""} aria-pressed={mode === "image"} onClick={() => { setMode("image"); setUploadError(""); invalidateAnalysis(); }}>이미지</button>
    </div>
    {mode === "text" ? <div className="mail-input-content mail-text-content">
      <textarea aria-label={title} value={text} onChange={event => { invalidateAnalysis(); setImage(""); setText(event.target.value); }} placeholder={placeholder} spellCheck={false} />
      <span className="field-foot">{text.length.toLocaleString()}자</span>
    </div> : <div className="mail-input-content mail-image-area">
      <input ref={fileInputRef} className="mail-image-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
      {image ? <div className="mail-image-preview"><img src={image} alt={`${title} 이미지 미리보기`} /><div><span>이미지가 첨부됐어요</span><div><button type="button" className="mail-image-action" onClick={() => fileInputRef.current?.click()}>이미지 바꾸기</button><button type="button" className="mail-image-action" onClick={() => { setImage(""); setMode("image"); setUploadError(""); invalidateAnalysis(); }}>제거</button></div></div></div> : <button type="button" className="mail-image-upload" onClick={() => fileInputRef.current?.click()}><span className="mail-image-upload-icon" aria-hidden="true">↑</span><strong>이미지를 선택하세요</strong><small>JPG, PNG, WEBP · 메일 캡처/사진</small></button>}
      {uploadError && <span className="mail-image-error" role="alert">{uploadError}</span>}
      <span className="field-foot">이미지는 분석 후 계정 이력에 저장됩니다.</span>
    </div>}
  </div>;
}

async function compressMailImage(file: File): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) throw new Error("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
  if (file.size > 15 * 1024 * 1024) throw new Error("원본 이미지가 15MB보다 커요.");
  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지를 처리하지 못했어요.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (blob && blob.size > 900_000) blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.72));
    if (!blob || blob.size > 900_000) throw new Error("이미지가 너무 커요. 해상도를 줄여 다시 올려주세요.");
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("이미지를 읽지 못했어요."));
      reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
      reader.readAsDataURL(blob);
    });
  } finally {
    bitmap.close();
  }
}

function ArrowIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function SelectWrap({ value, onChange, ariaLabel, children }: { value: string; onChange: (value: string) => void; ariaLabel: string; children: React.ReactNode }) { return <div className="select-wrap"><select aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)}>{children}</select><svg className="select-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>; }
