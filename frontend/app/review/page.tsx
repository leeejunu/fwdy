"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { DEFAULT_CARGO_CALCULATION_SETTINGS, parseCargoCalculationSettings, type CargoCalculationSettings } from "@/lib/cargo-settings";
import { QUOTE_ANALYSIS_SELECTED } from "@/lib/quote-history";
import type { CargoPieceInfo, MailAnalysisResponse } from "@/lib/quote-analysis";

type EditablePiece = { lengthCm: number | null; widthCm: number | null; heightCm: number | null; quantity: number | null; grossWeightKg: number | null };
type QuoteOverride = Record<string, string>;
type Charge = { label: string; amount: number | null; unit: string | null; condition: string | null; sourceText: string | null; minimum?: number | null };
type FlatQuote = { vendor: string | null; airline: string | null; destinationCode: string | null; rateBasis: string | null; charges: Charge[]; schedule: string | null; route: string | null; transitTime: string | null; notes: string | null; sourceText: string | null };
type EvaluatedCharge = { label: string; amount: number; unit: string; condition: string | null; minimum: number | null; total: number | null; formula: string; sourceText: string | null; calculationNote?: string | null };
const chargeBasis = (charge: Pick<EvaluatedCharge, "label" | "condition">) => {
  const basis = charge.condition?.trim().toUpperCase().replace(/^\//, "").replace(/^PER\s*/, "");
  if (charge.label === "Air freight" || !basis) return "";
  if (/^(B\/L|BL)$/.test(basis)) return "B/L";
  return /^(M|H|EA|AWB|RT|SHIPMENT)$/.test(basis) ? basis : "";
};
const chargeColumnKey = (charge: Pick<EvaluatedCharge, "label" | "condition">) => `${charge.label}:${chargeBasis(charge)}`;
const numberFormat = (value: number) => Math.round(value).toLocaleString("ko-KR");
const won = (value: number) => `${numberFormat(value)}원`;
const cleanText = (value: string | null | undefined) => value && value.trim() && value.trim().toLowerCase() !== "null" ? value : "";
const toEditablePiece = (piece: CargoPieceInfo): EditablePiece => ({
  lengthCm: piece.lengthCm, widthCm: piece.widthCm, heightCm: piece.heightCm,
  quantity: piece.quantity ?? 1, grossWeightKg: piece.grossWeightKg,
});

export default function AnalysisPage() {
  const [result, setResult] = useState<MailAnalysisResponse | null>(null);
  const [pieces, setPieces] = useState<EditablePiece[]>([]);
  const [cargoSettings, setCargoSettings] = useState<CargoCalculationSettings>(DEFAULT_CARGO_CALCULATION_SETTINGS);
  const [overrides, setOverrides] = useState<QuoteOverride>({});
  const [expandedQuote, setExpandedQuote] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function loadSelectedAnalysis() {
      setLoaded(false);
      try {
        const stored = sessionStorage.getItem("forward:analysis");
        const parsed = stored ? JSON.parse(stored) as MailAnalysisResponse : null;
        setResult(parsed);
        setPieces((parsed?.cargo?.pieces ?? []).map(toEditablePiece));
        setCargoSettings(parseCargoCalculationSettings(sessionStorage.getItem("forward:cargoSettings")));
        setOverrides(JSON.parse(sessionStorage.getItem("forward:quoteOverrides") ?? "{}"));
        setExpandedQuote(null);
      } catch {
        setResult(null);
        setPieces([]);
        setOverrides({});
      } finally {
        setLoaded(true);
      }
    }

    loadSelectedAnalysis();
    window.addEventListener(QUOTE_ANALYSIS_SELECTED, loadSelectedAnalysis);
    return () => window.removeEventListener(QUOTE_ANALYSIS_SELECTED, loadSelectedAnalysis);
  }, []);

  const cargo = useMemo(() => {
    const safeDivisor = Math.max(1, Number(cargoSettings.volumeDivisor) || 6000);
    const rows = pieces.map((piece) => {
      const dimensionsKnown = piece.lengthCm != null && piece.widthCm != null && piece.heightCm != null;
      const cbm = dimensionsKnown ? piece.lengthCm! * piece.widthCm! * piece.heightCm! / 1_000_000 : null;
      const volumeWeight = cbm == null ? null : cbm * 1_000_000 / safeDivisor;
      return { ...piece, cbm, volumeWeight };
    });
    const packages = rows.reduce((sum, row) => sum + (row.quantity ?? 0), 0) || result?.cargo?.packageCount || 0;
    const pieceWeight = rows.reduce((sum, row) => sum + (row.grossWeightKg ?? 0) * (row.quantity ?? 0), 0);
    const grossWeight = pieceWeight || result?.cargo?.grossWeightKg || 0;
    const totalVolume = rows.reduce((sum, row) => sum + (row.cbm ?? 0) * (row.quantity ?? 0), 0);
    const volumeWeight = rows.reduce((sum, row) => sum + (row.volumeWeight ?? 0) * (row.quantity ?? 0), 0);
    const raw = cargoSettings.cwMethod === "gross" ? grossWeight : cargoSettings.cwMethod === "volume" ? volumeWeight : Math.max(grossWeight, volumeWeight);
    const unit = cargoSettings.roundUnit === "none" ? 0 : Number(cargoSettings.roundUnit);
    const chargeableWeight = unit ? Math.ceil((raw - 1e-9) / unit) * unit : raw;
    return { rows, packages, grossWeight, totalVolume, volumeWeight, chargeableWeight };
  }, [pieces, result, cargoSettings]);

  function updatePiece(index: number, field: keyof EditablePiece, value: string) {
    setPieces(current => current.map((piece, i) => i === index ? { ...piece, [field]: value === "" ? null : Math.max(0, Number(value) || 0) } : piece));
  }
  function updateQuoteValue(key: string, value: string) {
    setOverrides(current => {
      const next = { ...current, [key]: value };
      sessionStorage.setItem("forward:quoteOverrides", JSON.stringify(next));
      return next;
    });
  }
  function quoteValue(key: string, original: string | number | null | undefined) {
    return overrides[key] ?? (typeof original === "string" ? cleanText(original) : original == null ? "" : String(original));
  }

  if (!loaded) return <WorkspaceShell><div className="loading-state">분석 결과를 불러오고 있어요…</div></WorkspaceShell>;
  if (!result) return <WorkspaceShell><div className="empty-state"><h1>분석 결과가 없어요</h1><p>메일 입력 화면에서 메일 분석을 먼저 진행해 주세요.</p><Link className="button button-primary" href="/analysis">메일 입력 화면으로</Link></div></WorkspaceShell>;

  const flatQuotes: FlatQuote[] = (result.quotes ?? []).flatMap(vendorQuote => (vendorQuote.offers ?? []).map(offer => {
    const rate = offer.rate;
    const surcharges = offer.surcharges;
    const charges: Charge[] = [];
    const unitPrice = rate?.unit_price ?? rate?.normal_rate;
    if (unitPrice != null) charges.push({ label: "Air freight", amount: unitPrice, unit: `${rate?.currency || "KRW"}/KG`, condition: rate?.basis ?? null, minimum: rate?.minimum, sourceText: offer.raw });
    if (surcharges?.fsc?.amount != null) {
      const fscCurrency = (surcharges.fsc.unit || "KRW").split("/")[0];
      charges.push({ label: "FSC", amount: surcharges.fsc.amount, unit: `${fscCurrency}/KG`, condition: null, sourceText: offer.raw });
    }
    if (cargoSettings.thcAmount.trim() !== "") {
      const thcBasis = cargoSettings.thcBasis;
      const thcCondition = thcBasis === "bl" ? "B/L" : thcBasis === "awb" ? "AWB" : thcBasis === "shipment" ? "SHIPMENT" : null;
      charges.push({ label: "THC", amount: Number(cargoSettings.thcAmount.replace(/,/g, "")), unit: thcBasis === "kg" ? "KRW/KG" : thcBasis === "rt" ? "KRW/RT" : "KRW", condition: thcCondition, sourceText: offer.raw });
    } else if (surcharges?.thc?.amount != null) charges.push({ label: "THC", amount: surcharges.thc.amount, unit: surcharges.thc.unit || "KRW", condition: null, sourceText: offer.raw });
    if (surcharges?.ams?.amount != null) charges.push({ label: "AMS", amount: surcharges.ams.amount, unit: surcharges.ams.currency || "KRW", condition: surcharges.ams.basis, sourceText: offer.raw });
    if (surcharges?.mcc?.amount != null) charges.push({ label: "MCC", amount: surcharges.mcc.amount, unit: surcharges.mcc.currency || "KRW", condition: surcharges.mcc.condition, sourceText: offer.raw });
    for (const item of surcharges?.other ?? []) {
      if (item.amount != null) charges.push({ label: item.code || "Other", amount: item.amount, unit: item.currency || "KRW", condition: item.basis, sourceText: offer.raw });
    }
    const transit = offer.transit_time;
    const transitTime = transit?.min_days != null && transit.max_days != null
      ? `${transit.min_days}–${transit.max_days} days`
      : transit?.min_days != null ? `${transit.min_days}+ days` : transit?.max_days != null ? `up to ${transit.max_days} days` : null;
    const notes = [...new Set([...(offer.conditions ?? []), ...(surcharges?.mcc?.condition ? [surcharges.mcc.condition] : [])].filter(Boolean))].join(" · ") || null;
    return {
      vendor: vendorQuote.vendor,
      airline: offer.airline,
      destinationCode: result.destination,
      rateBasis: rate?.basis ?? null,
      charges,
      schedule: offer.schedule?.frequency ?? null,
      route: offer.routing?.via ? `${offer.routing.via}${offer.routing.transit ? " T/S" : ""}` : null,
      transitTime,
      notes,
      sourceText: offer.raw,
    };
  }));

  const evaluatedQuotes = flatQuotes.map((quote, quoteIndex) => {
    const basis = quoteValue(`${quoteIndex}:basis`, quote.rateBasis);
    const minimumWeight = basis.trim().toUpperCase().replace(/\s+/g, "").match(/^AS(?:\+)?(\d+(?:\.\d+)?)$/);
    const appliedWeight = minimumWeight ? Math.max(cargo.chargeableWeight, Number(minimumWeight[1])) : cargo.chargeableWeight;
    const charges: EvaluatedCharge[] = quote.charges.map((charge: Charge, chargeIndex) => {
      const amountText = quoteValue(`${quoteIndex}:charge:${chargeIndex}`, charge.amount);
      const amount = Number(amountText.replace(/,/g, ""));
      const minimumText = charge.label === "Air freight" ? quoteValue(`${quoteIndex}:minimum`, charge.minimum) : "";
      const parsedMinimum = minimumText === "" ? null : Number(minimumText.replace(/,/g, ""));
      const minimum = parsedMinimum != null && Number.isFinite(parsedMinimum) ? parsedMinimum : null;
      const unit = charge.unit ?? "";
      const normalizedUnit = unit.toUpperCase().replace(/[\s₩]/g, "");
      const label = charge.label || "요금 항목";
      if (!Number.isFinite(amount) || amountText === "") return { label, amount: 0, unit, condition: charge.condition, minimum, total: null, formula: "금액 확인 필요", sourceText: charge.sourceText };
      if (/\/(KG|PERKG)$/.test(normalizedUnit)) {
        const weightTotal = amount * appliedWeight;
        const total = minimum != null ? Math.max(weightTotal, minimum) : weightTotal;
        const minimumNote = minimum != null ? ` · 최소 ${won(minimum)}` : "";
        return { label, amount, unit, condition: charge.condition, minimum, total, formula: `${numberFormat(amount)} × ${numberFormat(appliedWeight)} kg${minimumNote} = ${won(total)}`, sourceText: charge.sourceText };
      }
      if (normalizedUnit === "KRW/RT") {
        const revenueTons = Math.max(cargo.totalVolume, cargo.grossWeight / 1_000);
        if (revenueTons <= 0) return { label, amount, unit, condition: charge.condition, minimum, total: null, formula: "CBM 또는 중량 확인 필요", sourceText: charge.sourceText };
        const total = amount * revenueTons;
        return { label, amount, unit, condition: charge.condition, minimum, total, formula: `${numberFormat(amount)} × ${revenueTons.toFixed(3)} RT = ${won(total)}`, sourceText: charge.sourceText };
      }
      if (/^(KRW|WON|원|[A-Z]{3})$/.test(normalizedUnit)) return { label, amount, unit, condition: charge.condition, minimum, total: amount, formula: `${won(amount)} · ${charge.condition ? `${charge.condition} 기준` : "고정 금액"}`, sourceText: charge.sourceText };
      return { label, amount, unit, condition: charge.condition, minimum, total: null, formula: unit ? `단위 확인 필요 (${unit})` : "적용 단위 확인 필요", sourceText: charge.sourceText };
    });
    const calculationCharges = combineAirFreightFscAndShipmentCharges(charges, appliedWeight);
    const total = calculationCharges.reduce((sum, charge) => sum + (charge.total ?? 0), 0);
    const uncalculated = calculationCharges.filter(charge => charge.total == null).length;
    return { quote, quoteIndex, basis, appliedWeight, charges, calculationCharges, total, uncalculated };
  });
  const chargeColumns = evaluatedQuotes.flatMap(item => item.charges).reduce<EvaluatedCharge[]>((columns, charge) => {
    if (!columns.some(column => chargeColumnKey(column) === chargeColumnKey(charge))) columns.push(charge);
    return columns;
  }, []);
  const expandedCalculation = evaluatedQuotes.find(item => item.quoteIndex === expandedQuote) ?? null;
  const quoteColumnCount = 9 + chargeColumns.length;
  const comparableQuotes = evaluatedQuotes.filter(item => item.charges.length > 0 && item.uncalculated === 0);
  const best = comparableQuotes.reduce<(typeof comparableQuotes)[number] | null>((current, item) => !current || item.total < current.total ? item : current, null);
  const cargoType = cleanText(result.cargo?.cargoType) || "확인 필요";
  const detectedStackability = result.cargo?.stackable == null ? "확인 필요" : result.cargo.stackable ? "다단 가능" : "다단 불가";
  const stackability = cargoSettings.stackability === "from_mail"
    ? detectedStackability
    : cargoSettings.stackability === "stackable" ? "다단 가능" : "다단 불가";
  const destinations = (result.destinations ?? []).map(item => cleanText(item.name) || cleanText(item.code)).filter(Boolean);

  return <WorkspaceShell><div className="page-wrap review-page mx-auto w-full max-w-[1120px]">
    <div className="steps" aria-label="견적 진행 단계"><Link className="step done" href="/analysis"><i>✓</i> 메일 수집</Link><b /><Link className="step active" href="/review" aria-current="step"><i>2</i> 추출 결과 검토</Link></div>
    <section className="review-hero"><Link href="/analysis" className="back-link">← 메일 입력으로 돌아가기</Link><div className="eyebrow">EXTRACTED QUOTE DATA</div><h1>분석된 내용을 검토해주세요.</h1><p>AI가 메일에서 정리한 내용을 확인하고, 필요한 항목은 직접 수정할 수 있어요.</p><div className="route-chips"><span><b>목적지</b> {destinations.length ? [...new Set(destinations)].join(" · ") : "확인 필요"}</span><span><b>화물</b> {cargoType}</span><span><b>적재</b> {stackability}</span><span><b>희망 입고</b> {cleanText(result.requestedWarehouseDate) || "미확인"}</span></div></section>

    <section className="source-check-notice" role="note" aria-label="메일 원문 확인 안내">
      <span className="source-check-icon" aria-hidden="true">i</span>
      <div><strong>자동 정리된 내용을 메일 원문과 대조해 주세요</strong><p>도착지, 화물 정보, 운임 조건과 일정을 확인한 뒤 견적에 사용해 주세요.</p></div>
      <Link href="/analysis">메일 원문 확인 <span aria-hidden="true">→</span></Link>
    </section>

    {result.warnings?.length > 0 && <section className="extraction-warnings" aria-label="메일 원문 확인이 필요한 항목"><strong>원문 확인이 필요한 항목</strong>{result.warnings.map((warning, index) => <p key={index}><span>{warningFieldLabel(warning.field)}</span>{warning.message || "메일 내용을 다시 확인해 주세요."}{warning.source && <small>{warning.source}</small>}</p>)}</section>}

    <section className="card review-card">
      <div className="card-heading"><div><span className="section-index">01 <i>·</i> CARGO DETAILS</span><h2>화물 정보</h2><p>치수와 중량, Chargeable Weight 계산 조건을 확인하세요.</p></div><button className="button button-quiet" onClick={() => setPieces(current => [...current, { lengthCm: null, widthCm: null, heightCm: null, quantity: 1, grossWeightKg: null }])}>＋ 화물 추가</button></div>
      <div className="metric-grid grid grid-cols-2 md:grid-cols-5"><Metric label="Packages" value={`${cargo.packages} PKG`} hint="포장 수량"/><Metric label="Gross Weight" value={`${cargo.grossWeight.toFixed(1)} KG`} hint="실중량"/><Metric label="Volume" value={`${cargo.totalVolume.toFixed(4)} CBM`} hint="치수 기반 합계"/><Metric label="Volume Weight" value={`${cargo.volumeWeight.toFixed(1)} KG`} hint={`÷ ${Number(cargoSettings.volumeDivisor || 6000).toLocaleString()}`}/><Metric label="Chargeable Weight" value={`${cargo.chargeableWeight.toLocaleString()} KG`} hint="운임 적용 중량" accent/></div>
      <div className="settings-grid cargo-settings-grid grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="적용한 화물 계산 설정">
        <div><span>부피중량 나눗수</span><output className="static-setting">{Number(cargoSettings.volumeDivisor).toLocaleString()} cm³/kg</output></div>
        <div><span>C/W 절상 단위</span><output className="static-setting">{cargoSettings.roundUnit === "none" ? "절상 안 함" : `${cargoSettings.roundUnit} kg 단위 올림`}</output></div>
        <div><span>Chargeable Weight 기준</span><output className="static-setting">{cargoSettings.cwMethod === "max" ? "G/W와 V/W 중 큰 값" : cargoSettings.cwMethod === "gross" ? "G/W만 적용" : "V/W만 적용"}</output></div>
        <div><span>적재 조건</span><output className="static-setting">{cargoSettings.stackability === "from_mail" ? `메일 기준 · ${stackability}` : `${stackability} · 직접 설정`}</output></div>
      </div>
      <div className="table-scroll"><table className="cargo-table"><thead><tr><th>#</th><th>Length (cm)</th><th>Width (cm)</th><th>Height (cm)</th><th>Qty</th><th>Gross (kg)</th><th>CBM / PKG</th><th>V/W (kg)</th><th></th></tr></thead><tbody>{cargo.rows.length ? cargo.rows.map((piece, index) => <tr key={index}><td className="row-index">{String(index + 1).padStart(2, "0")}</td><td><NumberInput label={`화물 ${index + 1} 길이`} value={piece.lengthCm} onChange={value => updatePiece(index, "lengthCm", value)}/></td><td><NumberInput label={`화물 ${index + 1} 너비`} value={piece.widthCm} onChange={value => updatePiece(index, "widthCm", value)}/></td><td><NumberInput label={`화물 ${index + 1} 높이`} value={piece.heightCm} onChange={value => updatePiece(index, "heightCm", value)}/></td><td><NumberInput label={`화물 ${index + 1} 수량`} value={piece.quantity} onChange={value => updatePiece(index, "quantity", value)}/></td><td><NumberInput label={`화물 ${index + 1} 실중량`} value={piece.grossWeightKg} step="0.1" onChange={value => updatePiece(index, "grossWeightKg", value)}/></td><td className="table-number">{piece.cbm == null ? "확인 필요" : piece.cbm.toFixed(4)}</td><td className="table-number">{piece.volumeWeight == null ? "—" : (piece.volumeWeight * (piece.quantity ?? 0)).toFixed(1)}</td><td><button className="remove-row" aria-label={`화물 ${index + 1} 삭제`} onClick={() => setPieces(current => current.filter((_, i) => i !== index))}>×</button></td></tr>) : <tr><td colSpan={9} className="table-empty">화물 상세를 추출하지 못했어요. 화물 추가로 직접 입력할 수 있습니다.</td></tr>}</tbody></table></div>
      <div className="calculation-callout"><span>i</span><p>부피중량은 <strong>치수 × 치수 × 치수 ÷ {Number(cargoSettings.volumeDivisor || 6000).toLocaleString()}</strong>으로 계산하고, 설정한 기준과 절상 단위를 적용합니다.{!pieces.length && result.cargo?.grossWeightKg != null && <> 화물별 치수가 없어 부피중량은 현재 0 kg으로 계산됩니다.</>}</p></div>
    </section>

    <section className="card review-card quote-card">
      <div className="card-heading"><div><span className="section-index">02 <i>·</i> CONSOLIDATOR QUOTES</span><h2>콘솔사 운임 데이터</h2><p>AI가 추출한 운임 항목을 표시합니다. 금액과 기준은 직접 수정할 수 있어요.</p></div><span className="currency-tag">{evaluatedQuotes.length}개 운임</span></div>
      <div className="quote-scroll"><table className="quote-table dynamic-quote-table" style={{ minWidth: 1120 + (chargeColumns.length + 1) * 135 }}><thead><tr><th>콘솔사 / 항공사</th><th>Rate Basis</th><th>Applied Wt.</th><th className="charge-column-heading">Minimum <small> / KRW</small></th>{chargeColumns.map(column => <th className="charge-column-heading" key={chargeColumnKey(column)}><span>{column.label}</span>{column.label === "Air freight" && column.unit && <small> / {column.unit}</small>}{chargeBasis(column) && <small> / {chargeBasis(column)}</small>}</th>)}<th>Schedule</th><th>Route</th><th>Transit</th><th>비고</th><th className="total-heading">계산 합계</th></tr></thead><tbody>{evaluatedQuotes.length ? evaluatedQuotes.map(({ quote, quoteIndex, basis, appliedWeight, charges, total, uncalculated }) => {
        const isExpanded = expandedQuote === quoteIndex;
        const detailId = `calculation-${quoteIndex}`;
        return <tr key={quoteIndex} id={`quote-row-${quoteIndex}`} className={`quote-data-row ${isExpanded ? "expanded" : ""}`} tabIndex={0} aria-expanded={isExpanded} aria-controls={detailId} onClick={event => { if (!(event.target as HTMLElement).closest("input,button,select,textarea")) setExpandedQuote(current => current === quoteIndex ? null : quoteIndex); }} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setExpandedQuote(current => current === quoteIndex ? null : quoteIndex); } }}>
          <td className="vendor-cell"><strong>{cleanText(quote.vendor) || "콘솔사 확인 필요"} · {cleanText(quote.airline) || "항공사 확인 필요"}<span className={`row-chevron ${isExpanded ? "open" : ""}`}>⌄</span></strong><small>{cleanText(quote.destinationCode) || "목적지 확인 필요"}</small></td>
          <td><QuoteTextInput label="Rate Basis" value={quoteValue(`${quoteIndex}:basis`, quote.rateBasis)} onChange={value => updateQuoteValue(`${quoteIndex}:basis`, value)}/></td>
          <td className="applied-weight">{numberFormat(appliedWeight)} KG</td>
          <td className="dynamic-charge-cell"><RateInput label="Minimum charge (KRW)" value={quoteValue(`${quoteIndex}:minimum`, charges.find(charge => charge.label === "Air freight")?.minimum)} onChange={value => updateQuoteValue(`${quoteIndex}:minimum`, value)}/></td>
          {chargeColumns.map(column => {
            const chargeIndex = charges.findIndex(charge => chargeColumnKey(charge) === chargeColumnKey(column));
            const charge = chargeIndex >= 0 ? charges[chargeIndex] : null;
            return <td className="dynamic-charge-cell" key={chargeColumnKey(column)}>{charge ? <div className="charge-editor" title={charge.sourceText || undefined}><RateInput label={`${charge.label}${charge.condition ? ` ${charge.condition}` : ""} 금액`} value={quoteValue(`${quoteIndex}:charge:${chargeIndex}`, charge.amount)} onChange={value => updateQuoteValue(`${quoteIndex}:charge:${chargeIndex}`, value)}/></div> : <span className="muted-value">—</span>}</td>;
          })}
          <td><QuoteTextInput label="Schedule" value={quoteValue(`${quoteIndex}:schedule`, quote.schedule)} onChange={value => updateQuoteValue(`${quoteIndex}:schedule`, value)}/></td>
          <td><QuoteTextInput label="Route" value={quoteValue(`${quoteIndex}:route`, quote.route)} onChange={value => updateQuoteValue(`${quoteIndex}:route`, value)}/></td>
          <td><QuoteTextInput label="Transit time" value={quoteValue(`${quoteIndex}:transit`, quote.transitTime)} onChange={value => updateQuoteValue(`${quoteIndex}:transit`, value)}/></td>
          <td><QuoteTextInput label="비고" value={quoteValue(`${quoteIndex}:notes`, quote.notes)} onChange={value => updateQuoteValue(`${quoteIndex}:notes`, value)}/></td>
          <td className="total-cell">{uncalculated > 0 ? `부분합 ${won(total)}` : won(total)}{uncalculated > 0 && <small className="total-warning">미계산 {uncalculated}건</small>}</td>
        </tr>;
      }) : <tr><td colSpan={quoteColumnCount} className="table-empty">콘솔사 메일에서 운임 제안을 추출하지 못했습니다.</td></tr>}</tbody></table></div>
      {expandedCalculation && <div id={`calculation-${expandedCalculation.quoteIndex}`} className="calculation-detail-panel"><QuoteCalculation vendor={expandedCalculation.quote.vendor} airline={expandedCalculation.quote.airline} basis={expandedCalculation.basis} chargeableWeight={cargo.chargeableWeight} appliedWeight={expandedCalculation.appliedWeight} charges={expandedCalculation.calculationCharges} total={expandedCalculation.total} sourceText={expandedCalculation.quote.sourceText}/></div>}
      <div className="quote-foot"><span><i>i</i> 단위가 확인되는 운임만 합계에 반영합니다. 미계산 항목은 원문과 함께 확인해 주세요.</span><span>계산 기준 중량 <strong>{cargo.chargeableWeight} kg</strong></span></div>
    </section>

    <section className="card cost-card"><div className="card-heading"><div><span className="section-index">03 <i>·</i> COST PREVIEW</span><h2>예상 원가</h2><p>추출된 단위와 수정한 운임 금액을 기준으로 합산합니다.</p></div><span className="preview-tag">PREVIEW</span></div><div className="cost-layout"><div className="recommend-box"><span>단위가 확인된 운임 비교</span>{best ? <><h3>{cleanText(best.quote.vendor) || "콘솔사"} · {cleanText(best.quote.airline) || "항공사"} <small>/ {cleanText(best.quote.route) || cleanText(best.quote.destinationCode) || "경로 확인 필요"}</small></h3><strong>{won(best.total)}</strong><p>모든 추출 요금의 단위가 확인된 견적만 비교합니다.</p></> : <p>{evaluatedQuotes.length ? "단위가 불분명한 요금이 있어 아직 총액을 비교할 수 없어요. 입력칸에서 단위와 금액을 확인해 주세요." : "비교할 수 있는 운임 데이터가 없습니다."}</p>}</div><div className="cost-breakdown">{best ? best.calculationCharges.map((charge, index) => <div key={`${charge.label}-${index}`}><span>{charge.label} {charge.unit && `· ${charge.unit}`}</span><strong>{charge.total == null ? "미계산" : won(charge.total)}</strong></div>) : <div><span>추출된 운임</span><strong>단위 확인 필요</strong></div>}<div className="breakdown-total"><span>계산 합계</span><strong>{best ? won(best.total) : "—"}</strong></div></div></div></section>
  </div></WorkspaceShell>;
}

function Metric({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) { return <div className={`metric ${accent ? "metric-accent" : ""}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>; }
function warningFieldLabel(field: string | null) {
  const normalized = (field ?? "").toLowerCase();
  if (normalized.includes("destination")) return "목적지 코드";
  if (normalized.includes("schedule")) return "운항 일정";
  if (normalized.includes("piece") || normalized.includes("dimension")) return "화물 규격";
  if (normalized.includes("grossweight")) return "실중량";
  if (normalized.includes("minimum")) return "최소 운임";
  if (normalized.includes("rate") || normalized.includes("unit_price")) return "운임";
  if (normalized.includes("warehouse")) return "입고 희망일";
  if (normalized.includes("stackable")) return "적재 조건";
  return "메일 내용";
}
function NumberInput({ label, value, step = "1", onChange }: { label: string; value: number | null; step?: string; onChange: (value: string) => void }) { return <input className="table-input" aria-label={label} type="number" min="0" step={step} value={value ?? ""} onChange={event => onChange(event.target.value)}/>; }
function RateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <input className="quote-input" aria-label={label} type="number" step="any" value={value} onChange={event => onChange(event.target.value)}/>; }
function QuoteTextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <input className="quote-input quote-text-input" aria-label={label} type="text" value={value} onChange={event => onChange(event.target.value)}/>; }
function QuoteCalculation({ vendor, airline, basis, chargeableWeight, appliedWeight, charges, total, sourceText }: { vendor: string | null; airline: string | null; basis: string; chargeableWeight: number; appliedWeight: number; charges: EvaluatedCharge[]; total: number; sourceText: string | null }) {
  const basisMatch = basis.trim().toUpperCase().replace(/\s+/g, "").match(/^AS(?:\+)?(\d+(?:\.\d+)?)$/);
  const weightExplanation = basisMatch
    ? chargeableWeight >= Number(basisMatch[1])
      ? `운임 적용 중량 ${numberFormat(chargeableWeight)} kg이 ${numberFormat(Number(basisMatch[1]))} kg 기준보다 커서 그대로 적용했어요.`
      : `${numberFormat(chargeableWeight)} kg보다 ${cleanText(basis) || "최소 중량 기준"}이 커서 ${numberFormat(appliedWeight)} kg을 적용했어요.`
    : `화물 정보에서 계산한 운임 적용 중량 ${numberFormat(appliedWeight)} kg을 적용했어요.`;
  const calculatedCharges = charges.filter(charge => charge.total != null);
  const uncalculatedCount = charges.length - calculatedCharges.length;
  return <div className="calculation-detail">
    <div className="calculation-detail-heading">
      <div><span className="calculation-detail-kicker">CALCULATION FLOW</span><strong>계산 흐름</strong><span>{cleanText(vendor) || "콘솔사"} · {cleanText(airline) || "항공사"}</span></div>
      <span className="calculation-total">{uncalculatedCount ? "확인된 항목 합계" : "계산 합계"} · {won(total)}</span>
    </div>
    <div className="calculation-flow" aria-label="운임 계산 순서">
      <section className="calculation-flow-card calculation-weight-card">
        <div className="calculation-flow-label"><i>01</i><span>적용 중량</span></div>
        <strong className="calculation-flow-value">{numberFormat(appliedWeight)} <small>kg</small></strong>
        <p>{weightExplanation}</p>
        {basis && <span className="calculation-basis-tag">운임 기준 {basis}</span>}
      </section>
      <span className="calculation-flow-arrow" aria-hidden="true">→</span>
      <section className="calculation-flow-card calculation-charge-card">
        <div className="calculation-flow-label"><i>02</i><span>요금 항목별 계산</span></div>
        {charges.length ? <div className="calculation-charge-list">{charges.map((charge, index) => {
          const detail = describeChargeCalculation(charge, appliedWeight);
          return <div className={`calculation-charge-row ${charge.total == null ? "needs-review" : ""}`} key={`${charge.label}-${index}`}>
            <div className="calculation-charge-name"><strong>{charge.label}</strong><small>{[charge.unit, chargeConditionDescription(charge.condition)].filter(Boolean).join(" · ") || "단위 확인 필요"}</small></div>
            <div className="calculation-charge-math"><span>{detail.formula}</span>{detail.note && <small>{detail.note}</small>}</div>
            <strong className="calculation-charge-total">{charge.total == null ? "확인 필요" : won(charge.total)}</strong>
          </div>;
        })}</div> : <p className="calculation-empty">계산할 운임 항목이 없어요.</p>}
      </section>
      <span className="calculation-flow-arrow" aria-hidden="true">→</span>
      <section className="calculation-flow-card calculation-total-card">
        <div className="calculation-flow-label"><i>03</i><span>{uncalculatedCount ? "확인된 항목 합계" : "최종 합계"}</span></div>
        <strong className="calculation-flow-value">{won(total)}</strong>
        <p className="calculation-sum-equation">{calculatedCharges.map(charge => won(charge.total!)).join(" + ") || "계산된 요금 없음"} = {won(total)}</p>
        {uncalculatedCount > 0 && <small className="calculation-partial-note">미계산 {uncalculatedCount}건은 합계에서 제외했어요.</small>}
      </section>
    </div>
    {sourceText && <details className="quote-source"><summary>콘솔사 메일 근거 보기</summary><p>{sourceText}</p></details>}
  </div>;
}

function describeChargeCalculation(charge: EvaluatedCharge, appliedWeight: number) {
  if (charge.calculationNote) return { formula: charge.formula, note: charge.calculationNote };
  if (charge.total == null) return { formula: charge.formula, note: "단위가 확인되지 않아 합계에 포함하지 않았어요." };
  const normalizedUnit = charge.unit.toUpperCase().replace(/[\s₩]/g, "");
  if (/\/(KG|PERKG)$/.test(normalizedUnit)) {
    const rateTotal = charge.amount * appliedWeight;
    if (charge.minimum != null) {
      const minimumApplied = charge.minimum > rateTotal;
      return {
        formula: `${numberFormat(charge.amount)}원/kg × ${numberFormat(appliedWeight)} kg = ${won(rateTotal)}`,
        note: `최소 운임 ${won(charge.minimum)}과 비교해 ${minimumApplied ? "최소 운임" : "기본 운임"}을 적용했어요.`,
      };
    }
    return { formula: `${numberFormat(charge.amount)}원/kg × ${numberFormat(appliedWeight)} kg`, note: null };
  }
  if (normalizedUnit === "KRW/RT") return { formula: charge.formula, note: "적용 RT는 CBM과 중량(톤) 중 큰 값으로 계산했어요." };
  const conditionDescription = chargeConditionDescription(charge.condition);
  return {
    formula: `${won(charge.amount)}${conditionDescription ? ` · ${conditionDescription}` : " · 고정 금액"}`,
    note: null,
  };
}

function combineAirFreightFscAndShipmentCharges(charges: EvaluatedCharge[], appliedWeight: number) {
  const isPerKg = (charge: EvaluatedCharge) => /\/(KG|PERKG)$/.test(charge.unit.toUpperCase().replace(/[\s₩]/g, ""));
  const airIndex = charges.findIndex(charge => charge.label === "Air freight" && isPerKg(charge));
  const fscIndex = charges.findIndex(charge => charge.label === "FSC" && isPerKg(charge));
  if (airIndex < 0 || appliedWeight <= 0) return charges;

  const air = charges[airIndex];
  const fsc = fscIndex >= 0 ? charges[fscIndex] : null;
  const currency = (unit: string) => unit.toUpperCase().replace(/[\s₩]/g, "").split("/")[0];
  const sameCurrency = (charge: EvaluatedCharge) => currency(air.unit) === currency(charge.unit);
  const canCombineFsc = fsc != null && sameCurrency(fsc);
  const shipmentCharges = charges.filter(charge => {
    const basis = charge.condition?.toUpperCase().replace(/[^A-Z]/g, "");
    return ["BL", "BILLOFLADING", "M", "H", "AWB", "SHIPMENT"].includes(basis ?? "")
      && /^(KRW|WON|원|[A-Z]{3})$/.test(charge.unit.toUpperCase().replace(/[\s₩]/g, ""))
      && sameCurrency(charge);
  });
  if (!canCombineFsc && shipmentCharges.length === 0) return charges;

  const amountKnown = air.total != null
    && (!canCombineFsc || fsc.total != null)
    && shipmentCharges.every(charge => charge.total != null);
  const airRateTotal = air.amount * appliedWeight;
  const minimumApplied = air.minimum != null && air.minimum > airRateTotal;
  const shipmentTotal = shipmentCharges.reduce((sum, charge) => sum + (charge.total ?? 0), 0);
  const shipmentAmountSum = `(${shipmentCharges.map(charge => numberFormat(charge.total ?? 0)).join(" + ")})`;
  const shipmentBases = [...new Set(shipmentCharges.map(charge => chargeBasis(charge)))];
  const includedTotal = (air.total ?? 0) + (canCombineFsc ? fsc!.total ?? 0 : 0) + shipmentTotal;
  const combinedLabels = ["Air freight", canCombineFsc ? "FSC" : null, shipmentCharges.length ? "건별 비용" : null].filter(Boolean);
  const rateParts = [numberFormat(air.amount), canCombineFsc ? numberFormat(fsc!.amount) : null, shipmentCharges.length ? `${shipmentAmountSum} ÷ ${numberFormat(appliedWeight)}` : null].filter(Boolean);
  const nonMinimumFormula = `(${rateParts.join(" + ")})원/kg × ${numberFormat(appliedWeight)} kg = ${won(includedTotal)}`;
  const minimumFormula = [
    `Air freight 최소 운임 ${won(air.minimum!)}`,
    canCombineFsc ? `FSC ${numberFormat(fsc!.amount)}원/kg × ${numberFormat(appliedWeight)} kg` : null,
    shipmentCharges.length ? `${shipmentAmountSum} ÷ ${numberFormat(appliedWeight)} kg × ${numberFormat(appliedWeight)} kg` : null,
  ].filter(Boolean).join(" + ") + ` = ${won(includedTotal)}`;
  const perKgRateName = canCombineFsc ? "Air freight와 FSC" : "Air freight";
  const shipmentNote = shipmentCharges.length
    ? ` ${shipmentBases.join("/")} 기준 비용 ${won(shipmentTotal)}을 적용 중량 ${numberFormat(appliedWeight)} kg으로 나눠 kg당 운임에 반영했어요.`
    : "";
  const formula = !amountKnown
    ? "운임 항목 금액을 확인해 주세요"
    : minimumApplied
      ? minimumFormula
      : nonMinimumFormula;
  const combined: EvaluatedCharge = {
    label: combinedLabels.join(" + "),
    amount: air.amount + (canCombineFsc ? fsc!.amount : 0) + (shipmentCharges.length ? shipmentTotal / appliedWeight : 0),
    unit: air.unit,
    condition: null,
    minimum: null,
    total: amountKnown ? includedTotal : null,
    formula,
    calculationNote: !amountKnown
      ? "금액이 확인된 항목만 합산할 수 있어요."
      : minimumApplied
        ? `최소 운임은 Air freight에 적용했어요.${canCombineFsc ? " FSC는 적용 중량만큼 더했어요." : ""}${shipmentNote}`
        : `${perKgRateName}를 kg당 운임으로 합산했어요.${shipmentNote}${air.minimum != null ? ` 최소 운임 ${won(air.minimum)}은 적용되지 않았어요.` : ""}`,
    sourceText: air.sourceText ?? fsc?.sourceText ?? shipmentCharges[0]?.sourceText ?? null,
  };

  const groupedCharges = new Set<EvaluatedCharge>([air, ...(canCombineFsc ? [fsc!] : []), ...shipmentCharges]);
  return charges.flatMap(charge => charge === air ? [combined] : groupedCharges.has(charge) ? [] : [charge]);
}

function chargeConditionDescription(condition: string | null) {
  if (!condition) return "";
  const normalized = condition.trim().toUpperCase();
  if (normalized === "B/L" || normalized === "BL") return "B/L 기준";
  return /^(M|H|EA|AWB|SHIPMENT)$/.test(normalized) ? `${normalized} 기준` : `조건: ${condition}`;
}
