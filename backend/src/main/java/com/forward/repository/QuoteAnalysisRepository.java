package com.forward.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.forward.domain.entity.QuoteAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteAnalysisRepository extends JpaRepository<QuoteAnalysis, UUID> {
	List<QuoteAnalysis> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);

	List<QuoteAnalysis> findTop50ByUserIdIsNullOrderByCreatedAtDesc();

	Optional<QuoteAnalysis> findByIdAndUserId(UUID id, UUID userId);

	Optional<QuoteAnalysis> findByIdAndUserIdIsNull(UUID id);
}
