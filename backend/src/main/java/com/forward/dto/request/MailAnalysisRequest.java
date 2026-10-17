package com.forward.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public record MailAnalysisRequest(
		@Size(max = 1_250_000, message = "화주 메일 텍스트 또는 이미지가 너무 큽니다.")
		String shipperMail,
		@Size(max = 1_250_000, message = "콘솔사 메일 텍스트 또는 이미지가 너무 큽니다.")
		String consoleMail,
		@Size(max = 512, message = "화주 메일 이미지 경로가 너무 깁니다.")
		String shipperImagePath,
		@Size(max = 512, message = "콘솔사 메일 이미지 경로가 너무 깁니다.")
		String consoleImagePath,
		@Size(max = 10_000, message = "화물 계산 설정이 너무 깁니다.")
		String cargoSettings) {

	@AssertTrue(message = "화주 메일 또는 콘솔사 메일을 하나 이상 입력해 주세요.")
	public boolean hasAtLeastOneMail() {
		return (shipperMail != null && !shipperMail.isBlank())
				|| (consoleMail != null && !consoleMail.isBlank());
	}
}
