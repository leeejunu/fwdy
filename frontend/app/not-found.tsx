import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page min-h-screen overflow-hidden px-5 py-7 sm:px-8">
      <header className="not-found-header mx-auto flex w-full max-w-[1120px] items-center justify-between">
        <Link href="/" className="not-found-brand" aria-label="FWDY 홈으로">
          <FwdyMark />
          <span>FWDY</span>
        </Link>
        <span className="not-found-help">FORWARD, MADE EASY</span>
      </header>

      <section className="not-found-content mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-[1120px] flex-col items-center justify-center text-center">
        <div className="not-found-art" aria-hidden="true">
          <span className="not-found-orbit orbit-one" />
          <span className="not-found-orbit orbit-two" />
          <span className="not-found-plane"><PlaneIcon /></span>
          <span className="not-found-code">404</span>
        </div>
        <span className="not-found-eyebrow"><i /> PAGE NOT FOUND</span>
        <h1>페이지를 찾을 수 없어요.</h1>
        <p>주소가 잘못 입력되었거나, 페이지가 이동 또는 삭제되었을 수 있어요.</p>
        <div className="not-found-actions">
          <Link className="not-found-primary" href="/">FWDY 홈으로 가기 <ArrowIcon /></Link>
          <Link className="not-found-secondary" href="/login?next=%2Fanalysis">견적 정리 시작하기</Link>
        </div>
        <span className="not-found-footnote">문제가 계속되면 주소를 다시 확인해 주세요.</span>
      </section>
    </main>
  );
}

function FwdyMark() {
  return <svg width="31" height="26" viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="not-found-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="not-found-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#not-found-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#not-found-mint)" strokeWidth="8" strokeLinecap="round"/></svg>;
}

function ArrowIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function PlaneIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-8-8 18-2-8-8-2Z"/><path d="m11 13 4-4"/></svg>;
}
