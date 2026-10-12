package com.forward.dto.response;

import java.time.Instant;
import java.util.UUID;

public record QuoteAnalysisSummaryResponse(
		UUID id,
		Instant createdAt,
		String title,
		String detail) {
}
