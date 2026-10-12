package com.forward.exception;

public class QuoteAnalysisNotFoundException extends RuntimeException {
	public QuoteAnalysisNotFoundException() {
		super("견적 분석 기록을 찾을 수 없습니다.");
	}
}
