package com.forward.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.forward.dto.request.MailAnalysisRequest;
import com.forward.dto.response.QuoteAnalysisRecordResponse;
import com.forward.dto.response.QuoteAnalysisSummaryResponse;
import com.forward.service.MailAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quote-analyses")
@RequiredArgsConstructor
@Slf4j
public class QuoteAnalysisController {
	private final MailAnalysisService mailAnalysisService;

	@PostMapping
	public ResponseEntity<QuoteAnalysisRecordResponse> createAnalysis(@Valid @RequestBody MailAnalysisRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		UUID userId = userId(jwt);
		log.info("POST /api/quote-analyses received: userId={}, shipperMailChars={}, consoleMailChars={}", userId,
				request.shipperMail() == null ? 0 : request.shipperMail().length(),
				request.consoleMail() == null ? 0 : request.consoleMail().length());
		QuoteAnalysisRecordResponse created = mailAnalysisService.createAnalysis(request, userId);
		log.info("POST /api/quote-analyses completed: id={}, userId={}", created.id(), userId);
		return ResponseEntity.created(URI.create("/api/quote-analyses/" + created.id())).body(created);
	}

	@GetMapping
	public List<QuoteAnalysisSummaryResponse> listAnalyses(@AuthenticationPrincipal Jwt jwt) {
		UUID userId = userId(jwt);
		log.info("GET /api/quote-analyses received: userId={}", userId);
		List<QuoteAnalysisSummaryResponse> records = mailAnalysisService.listAnalyses(userId);
		log.info("GET /api/quote-analyses completed: userId={}, count={}", userId, records.size());
		return records;
	}

	@GetMapping("/{id}")
	public QuoteAnalysisRecordResponse getAnalysis(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		UUID userId = userId(jwt);
		log.info("GET /api/quote-analyses/{} received: userId={}", id, userId);
		return mailAnalysisService.getAnalysis(id, userId);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteAnalysis(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		UUID userId = userId(jwt);
		log.info("DELETE /api/quote-analyses/{} received: userId={}", id, userId);
		mailAnalysisService.deleteAnalysis(id, userId);
		return ResponseEntity.noContent().build();
	}

	private static UUID userId(Jwt jwt) {
		return jwt == null ? null : UUID.fromString(jwt.getSubject());
	}
}
