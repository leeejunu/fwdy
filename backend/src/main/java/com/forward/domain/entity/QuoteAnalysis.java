package com.forward.domain.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "quote_analyses", indexes = {
		@Index(name = "idx_quote_analyses_user_created_at", columnList = "user_id, created_at")
})
public class QuoteAnalysis {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "user_id")
	private UUID userId;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(nullable = false, length = 200)
	private String detail;

	@Column(name = "shipper_mail", nullable = false, columnDefinition = "text")
	private String shipperMail;

	@Column(name = "console_mail", nullable = false, columnDefinition = "text")
	private String consoleMail;

	@Column(name = "cargo_settings", nullable = false, columnDefinition = "text")
	private String cargoSettings;

	@Column(name = "analysis_result", nullable = false, columnDefinition = "text")
	private String analysisResult;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected QuoteAnalysis() {
	}

	public QuoteAnalysis(UUID userId, String title, String detail, String shipperMail,
			String consoleMail, String cargoSettings, String analysisResult) {
		this.userId = userId;
		this.title = title;
		this.detail = detail;
		this.shipperMail = shipperMail;
		this.consoleMail = consoleMail;
		this.cargoSettings = cargoSettings;
		this.analysisResult = analysisResult;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getTitle() {
		return title;
	}

	public String getDetail() {
		return detail;
	}

	public String getShipperMail() {
		return shipperMail;
	}

	public String getConsoleMail() {
		return consoleMail;
	}

	public String getCargoSettings() {
		return cargoSettings;
	}

	public String getAnalysisResult() {
		return analysisResult;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
