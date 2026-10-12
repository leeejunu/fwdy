package com.forward.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.forward.dto.request.MailAnalysisRequest;
import com.forward.dto.response.QuoteAnalysisRecordResponse;
import com.forward.dto.response.QuoteAnalysisSummaryResponse;
import com.forward.service.MailAnalysisService;
import jakarta.validation.Valid;
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
public class QuoteAnalysisController {
	private final MailAnalysisService mailAnalysisService;

	public QuoteAnalysisController(MailAnalysisService mailAnalysisService) {
		this.mailAnalysisService = mailAnalysisService;
	}

	@PostMapping
	public ResponseEntity<QuoteAnalysisRecordResponse> createAnalysis(@Valid @RequestBody MailAnalysisRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		QuoteAnalysisRecordResponse created = mailAnalysisService.createAnalysis(request, userId(jwt));
		return ResponseEntity.created(URI.create("/api/quote-analyses/" + created.id())).body(created);
	}

	@GetMapping
	public List<QuoteAnalysisSummaryResponse> listAnalyses(@AuthenticationPrincipal Jwt jwt) {
		return mailAnalysisService.listAnalyses(userId(jwt));
	}

	@GetMapping("/{id}")
	public QuoteAnalysisRecordResponse getAnalysis(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		return mailAnalysisService.getAnalysis(id, userId(jwt));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteAnalysis(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		mailAnalysisService.deleteAnalysis(id, userId(jwt));
		return ResponseEntity.noContent().build();
	}

	private static UUID userId(Jwt jwt) {
		return jwt == null ? null : UUID.fromString(jwt.getSubject());
	}
}
