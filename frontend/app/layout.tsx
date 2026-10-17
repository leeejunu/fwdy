import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const AgentationDev = process.env.NODE_ENV === "development"
  ? dynamic(() => import("./agentation-dev"))
  : () => null;

export const metadata: Metadata = {
  title: "FWDY | 포워딩 견적 워크스페이스",
  description: "포워딩 메일에서 화물 정보와 운임을 빠르게 정리합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}{process.env.NODE_ENV === "development" && <AgentationDev />}</body>
    </html>
  );
}
