package com.forward.dto.response;

import java.time.Instant;
import java.util.UUID;

public record QuoteAnalysisRecordResponse(
		UUID id,
		Instant createdAt,
		String title,
		String detail,
		String shipperMail,
		String consoleMail,
		String cargoSettings,
		MailAnalysisResponse analysis) {
}
