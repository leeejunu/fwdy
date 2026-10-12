package com.forward.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public record MailAnalysisRequest(
		@Size(max = 120_000, message = "화주 메일은 120,000자 이하여야 합니다.")
		String shipperMail,
		@Size(max = 120_000, message = "콘솔사 메일은 120,000자 이하여야 합니다.")
		String consoleMail,
		@Size(max = 10_000, message = "화물 계산 설정이 너무 깁니다.")
		String cargoSettings) {

	@AssertTrue(message = "화주 메일 또는 콘솔사 메일을 하나 이상 입력해 주세요.")
	public boolean hasAtLeastOneMail() {
		return (shipperMail != null && !shipperMail.isBlank())
				|| (consoleMail != null && !consoleMail.isBlank());
	}
}
