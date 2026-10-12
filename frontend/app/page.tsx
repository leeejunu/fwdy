import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-white text-[#192431]">
      <header className="landing-header sticky top-0 z-30 border-b border-[#edf0f4] bg-white/90 backdrop-blur-md">
        <div className="landing-header-inner mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="landing-brand flex items-center gap-2.5" aria-label="FWDY 홈">
            <FwdyMark />
            <span className="font-[Sora] text-[19px] font-extrabold tracking-[-1.2px]">FWDY</span>
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#6c7785] md:flex" aria-label="메인 메뉴">
            <a className="landing-nav-link" href="#features">기능</a>
            <a className="landing-nav-link" href="#workflow">이용 방법</a>
          </nav>
          <Link className="landing-header-cta inline-flex h-10 items-center gap-2 rounded-full bg-[#1c2734] px-5 text-[12px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2a394a]" href="/login?next=%2Fanalysis">
            시작하기 <ArrowIcon />
          </Link>
        </div>
      </header>

      <section className="landing-hero relative mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-20 pt-14 sm:px-8 md:min-h-[610px] md:grid-cols-[1.02fr_.98fr] md:gap-6 md:pb-24 md:pt-10">
        <div className="landing-glow" aria-hidden="true" />
        <div className="relative z-10 max-w-[550px]">
          <div className="landing-pill mb-7 inline-flex items-center gap-2 rounded-full border border-[#e5eaf0] bg-white/80 px-3.5 py-2 text-[11px] font-semibold text-[#526171] shadow-[0_4px_18px_rgba(30,55,85,.05)]">
            <span className="landing-pill-dot" /> 포워딩 견적 업무를 더 가볍게
          </div>
          <h1 className="max-w-[590px] text-[42px] font-bold leading-[1.2] tracking-[-2.8px] sm:text-[54px] md:text-[58px]">
            메일은 그대로,
            <br />견적은 <span className="landing-gradient-text">한눈에.</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-[14px] leading-[1.9] text-[#778392] sm:text-[15px]">
            화주 메일과 콘솔사 회신을 붙여 넣으면 필요한 정보를 정리하고,
            운임 계산과 비교까지 한곳에서 도와드려요.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link className="landing-primary-cta inline-flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#246ff2] px-6 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(36,111,242,.22)] transition hover:-translate-y-0.5 hover:bg-[#155fdf]" href="/login?next=%2Fanalysis">
              견적 정리 시작하기 <ArrowIcon />
            </Link>
            <a className="landing-secondary-cta inline-flex h-[52px] items-center justify-center rounded-xl px-5 text-[12px] font-semibold text-[#687585] transition hover:bg-[#f5f7fa]" href="#workflow">
              어떻게 쓰나요?
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[#8994a1]">
            <span className="landing-check"><CheckIcon /> 메일 원문 그대로</span>
            <span className="landing-check"><CheckIcon /> 계산 과정 확인</span>
            <span className="landing-check"><CheckIcon /> 값 직접 수정</span>
          </div>
        </div>

        <div className="landing-preview-wrap relative z-10 mx-auto w-full max-w-[545px] md:ml-auto">
          <div className="landing-orbit landing-orbit-one" aria-hidden="true" />
          <div className="landing-orbit landing-orbit-two" aria-hidden="true" />
          <div className="landing-preview relative rounded-[22px] border border-[#e7ebf1] bg-white p-3.5 shadow-[0_35px_90px_rgba(39,67,109,.14)] sm:p-5">
            <div className="flex items-center justify-between border-b border-[#edf0f4] px-1 pb-4">
              <div className="flex items-center gap-3">
                <div className="landing-preview-icon"><MailIcon /></div>
                <div><p className="text-[12px] font-semibold text-[#344253]">견적 워크스페이스</p><p className="mt-1 text-[9px] text-[#97a1ad]">메일에서 계산까지 한 흐름으로</p></div>
              </div>
              <span className="landing-preview-status"><i /> 정리 중</span>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-[.86fr_1.14fr]">
              <div className="landing-mail-stack">
                <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#596777]">메일 원문</span><span className="text-[9px] text-[#a0a9b5]">2개 입력</span></div>
                <div className="landing-mail-card"><span className="landing-mail-dot blue"/><span><b>화주 메일</b><small>화물 정보 · 요청 일정</small></span><CheckIcon /></div>
                <div className="landing-mail-card"><span className="landing-mail-dot violet"/><span><b>콘솔사 메일</b><small>운임 · 항공사 · 스케줄</small></span><CheckIcon /></div>
                <div className="landing-mail-hint"><SparkIcon /><span>형식을 맞추지 않아도<br/>원문 그대로 입력할 수 있어요.</span></div>
              </div>
              <div className="landing-result-card">
                <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#596777]">견적 정보</span><span className="landing-ready-tag">검토 가능</span></div>
                <div className="landing-result-head"><span>목적지</span><b>화물 정보</b><b>항공사별 운임</b></div>
                <div className="landing-result-row"><span><i className="tiny-blue"/> 목적지</span><b>메일에서 추출</b><em>확인</em></div>
                <div className="landing-result-row"><span><i className="tiny-teal"/> 화물</span><b>중량 · 부피</b><em>확인</em></div>
                <div className="landing-result-row"><span><i className="tiny-purple"/> 운임</span><b>요금 항목 정리</b><em>계산</em></div>
                <div className="landing-calculation"><span>예상 비용</span><span className="landing-calculation-line"/><b>자동 계산</b></div>
              </div>
            </div>
            <div className="landing-preview-footer"><span><i /> 입력한 값을 직접 확인하고 수정할 수 있어요.</span><span className="landing-footer-arrow"><ArrowIcon /></span></div>
          </div>
          <div className="landing-float-chip landing-float-top"><span className="landing-float-icon"><SparkIcon /></span><span><b>AI 메일 분석</b><small>필요한 항목만 쏙쏙</small></span></div>
          <div className="landing-float-chip landing-float-bottom"><span className="landing-float-check"><CheckIcon /></span><span><b>계산 과정까지 투명하게</b><small>항목별 산출 근거 확인</small></span></div>
        </div>
      </section>

      <section id="features" className="landing-features border-y border-[#edf0f4] bg-[#fafbfd]">
        <div className="mx-auto max-w-[1200px] px-5 py-[72px] sm:px-8 md:py-[86px]">
          <div className="mx-auto max-w-[570px] text-center">
            <p className="landing-section-kicker">MADE FOR FORWARDERS</p>
            <h2 className="mt-3 text-[27px] font-bold tracking-[-1.2px] sm:text-[32px]">견적 업무의 번거로움을<br className="sm:hidden"/> 한 흐름으로 정리해요.</h2>
            <p className="mt-3 text-[12px] leading-6 text-[#7b8795] sm:text-[13px]">반복해서 읽고, 옮겨 적고, 다시 계산하던 일을 더 간결하게.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
            <FeatureCard icon={<MailIcon />} number="01" title="메일 그대로 붙여넣기" text="화주 요청과 콘솔사 회신을 구분해 넣으면 분석이 시작돼요. 형식을 다시 만들 필요가 없어요." tone="blue" />
            <FeatureCard icon={<LayersIcon />} number="02" title="정보를 보기 쉽게 정리" text="화물 정보와 운임 항목, 스케줄을 검토하기 편한 구조로 모아 보여줘요." tone="mint" />
            <FeatureCard icon={<CalculatorIcon />} number="03" title="계산하고 직접 검토" text="요금 항목별 계산 과정을 확인하고, 운임이나 화물 정보를 수정할 수 있어요." tone="violet" />
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-workflow mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-[76px] sm:px-8 md:grid-cols-[.9fr_1.1fr] md:gap-20 md:py-[100px]">
        <div>
          <p className="landing-section-kicker">SIMPLE WORKFLOW</p>
          <h2 className="mt-3 max-w-[430px] text-[29px] font-bold leading-[1.35] tracking-[-1.3px] sm:text-[35px]">메일을 넣고,<br/>결과를 확인하면 끝.</h2>
          <p className="mt-4 max-w-[390px] text-[13px] leading-7 text-[#7b8795]">메일 분석부터 견적 검토까지, 익숙한 업무 흐름을 그대로 이어가세요.</p>
          <Link className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-[#246ff2] transition hover:gap-3" href="/login?next=%2Fanalysis">지금 시작하기 <ArrowIcon /></Link>
        </div>
        <div className="landing-steps rounded-[20px] border border-[#e9edf2] bg-white p-5 shadow-[0_15px_45px_rgba(33,54,79,.05)] sm:p-7">
          <WorkflowStep number="1" title="메일을 붙여넣어요" detail="화주 요청과 콘솔사 회신을 각각 입력" active />
          <WorkflowStep number="2" title="AI가 견적 정보를 정리해요" detail="화물, 운임, 일정에 필요한 항목 추출" active />
          <WorkflowStep number="3" title="계산 결과를 검토해요" detail="산출 근거를 확인하고 필요한 값 수정" />
        </div>
      </section>

      <section className="landing-bottom-cta mx-5 mb-16 rounded-[24px] sm:mx-8 md:mb-24">
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 px-6 py-10 sm:px-10 md:flex-row md:items-center md:px-14 md:py-12">
          <div><p className="text-[10px] font-bold tracking-[1.3px] text-[#a9c9ff]">READY WHEN YOU ARE</p><h2 className="mt-3 text-[25px] font-bold tracking-[-1.2px] text-white sm:text-[30px]">다음 견적, 더 가볍게 시작해요.</h2><p className="mt-2 text-[12px] text-white/65">받은 메일을 그대로 붙여 넣어보세요.</p></div>
          <Link className="landing-bottom-button inline-flex h-[48px] shrink-0 items-center gap-3 rounded-xl bg-white px-5 text-[12px] font-semibold text-[#205fc9] transition hover:-translate-y-0.5 hover:bg-[#f1f6ff]" href="/login?next=%2Fanalysis">견적 정리 시작하기 <ArrowIcon /></Link>
        </div>
      </section>

      <footer className="landing-footer mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 border-t border-[#edf0f4] px-5 py-6 text-[10px] text-[#98a2ad] sm:flex-row sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-[Sora] font-extrabold tracking-[-.5px] text-[#526171]"><FwdyMark small/> FWDY</Link>
        <span>Forward, made easy.</span>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, number, title, text, tone }: { icon: React.ReactNode; number: string; title: string; text: string; tone: string }) {
  return <article className="landing-feature-card rounded-[16px] border border-[#e9edf2] bg-white p-6 sm:p-7">
    <div className={`landing-feature-icon ${tone}`}>{icon}<span>{number}</span></div>
    <h3 className="mt-6 text-[15px] font-bold tracking-[-.4px] text-[#303d4c]">{title}</h3>
    <p className="mt-2 text-[11px] leading-[1.8] text-[#828d9a] sm:text-[12px]">{text}</p>
  </article>;
}

function WorkflowStep({ number, title, detail, active = false }: { number: string; title: string; detail: string; active?: boolean }) {
  return <div className="landing-workflow-step flex gap-4 py-4 first:pt-0 last:pb-0">
    <span className={`landing-step-number ${active ? "active" : ""}`}>{number}</span>
    <span className="min-w-0 flex-1"><b>{title}</b><small>{detail}</small></span>
    {active && <CheckIcon />}
  </div>;
}

function FwdyMark({ small = false }: { small?: boolean }) {
  return <svg width={small ? "25" : "31"} height={small ? "22" : "26"} viewBox="0 0 40 32" fill="none" aria-hidden="true"><defs><linearGradient id="landing-blue" x1="5" y1="5" x2="31" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="#155CFF"/><stop offset="1" stopColor="#35BDF4"/></linearGradient><linearGradient id="landing-mint" x1="5" y1="27" x2="31" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#38E0C2"/><stop offset="1" stopColor="#21BFD0"/></linearGradient></defs><path d="M8 7.5 30 16" stroke="url(#landing-blue)" strokeWidth="8" strokeLinecap="round"/><path d="M8 24.5 30 16" stroke="url(#landing-mint)" strokeWidth="8" strokeLinecap="round"/></svg>;
}
function ArrowIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
function CheckIcon() { return <svg className="landing-check-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4.5 10.2 3.6 3.5 7.4-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function MailIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>; }
function SparkIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/></svg>; }
function LayersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>; }
function CalculatorIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>; }
