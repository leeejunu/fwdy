package com.forward.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.springframework.lang.Nullable;

public record MailAnalysisResponse(
		@JsonPropertyDescription("콘솔사 운임 원문에서 확인한 목적지 코드. 여러 코드가 있거나 확인되지 않으면 null")
		@Nullable String destination,
		@JsonPropertyDescription("화주 메일에서 추출한 화물 정보")
		@Nullable CargoInfo cargo,
		@JsonPropertyDescription("화주 메일에 기재된 목적지명과 명시적으로 연결된 목적지 코드")
		List<DestinationInfo> destinations,
		@JsonPropertyDescription("희망 입고 일정의 원문 표현. 연도는 메일에 있을 때만 포함")
		@Nullable String requestedWarehouseDate,
		@JsonPropertyDescription("콘솔사별 운임. 같은 콘솔사의 항공사별 운임 제안은 offers 배열 안에서 분리")
		List<VendorQuoteInfo> quotes,
		@JsonPropertyDescription("추출 중 모호하거나 확인이 필요한 정보")
		List<ExtractionWarning> warnings) {

	public record CargoInfo(
			@Nullable Integer packageCount,
			@Nullable BigDecimal grossWeightKg,
			@Nullable String cargoType,
			@Nullable Boolean stackable,
			List<CargoPieceInfo> pieces,
			@Nullable String sourceText) {
	}

	public record CargoPieceInfo(
			@Nullable BigDecimal lengthCm,
			@Nullable BigDecimal widthCm,
			@Nullable BigDecimal heightCm,
			@Nullable Integer quantity,
			@Nullable BigDecimal grossWeightKg,
			@Nullable String sourceText) {
	}

	public record DestinationInfo(
			@Nullable String name,
			@Nullable String code,
			@Nullable String sourceText) {
	}

	public record VendorQuoteInfo(
			@JsonPropertyDescription("콘솔사명. 바잉/셀링은 vendor가 아닌 type에 기록")
			@Nullable String vendor,
			@JsonPropertyDescription("운임 유형. 예: buying, selling. 확인되지 않으면 null")
			@Nullable String type,
			List<QuoteOfferInfo> offers) {
	}

	public record QuoteOfferInfo(
			@JsonPropertyDescription("항공사 코드")
			@Nullable String airline,
			@Nullable RateInfo rate,
			@Nullable SurchargesInfo surcharges,
			@Nullable RoutingInfo routing,
			@Nullable ScheduleInfo schedule,
			@JsonProperty("transit_time") @Nullable TransitTimeInfo transitTime,
			List<String> conditions,
			@Nullable String raw) {
	}

	public record RateInfo(
			@JsonPropertyDescription("운임 기준. 예: AS45, N, M")
			@Nullable String basis,
			@JsonProperty("as_weight") @Nullable BigDecimal asWeight,
			@JsonProperty("unit_price") @Nullable BigDecimal unitPrice,
			@Nullable BigDecimal minimum,
			@JsonProperty("normal_rate") @Nullable BigDecimal normalRate,
			@JsonPropertyDescription("운임 통화. 원문에 통화가 없으면 KRW")
			@Nullable String currency) {
	}

	public record SurchargesInfo(
			@Nullable AmountUnitInfo fsc,
			@Nullable AmountUnitInfo thc,
			@Nullable AmountBasisInfo ams,
			@Nullable AmountConditionInfo mcc,
			List<OtherChargeInfo> other) {
	}

	public record AmountUnitInfo(
			@Nullable BigDecimal amount,
			@JsonPropertyDescription("요금 통화와 적용 단위. 통화가 빠졌으면 KRW를 사용하고, /KG가 명시되었을 때만 KRW/KG로 기록")
			@Nullable String unit) {
	}

	public record AmountBasisInfo(
			@Nullable BigDecimal amount,
			@JsonPropertyDescription("금액 통화가 불명확하면 KRW. 적용 기준은 별도 basis에 보존")
			@Nullable String currency,
			@Nullable String basis) {
	}

	public record AmountConditionInfo(
			@Nullable BigDecimal amount,
			@JsonPropertyDescription("원문에 통화가 없으면 KRW")
			@Nullable String currency,
			@Nullable String condition) {
	}

	public record OtherChargeInfo(
			@Nullable String code,
			@Nullable BigDecimal amount,
			@JsonPropertyDescription("원문에 통화가 없으면 KRW")
			@Nullable String currency,
			@Nullable String basis) {
	}

	public record RoutingInfo(
			@Nullable Boolean transit,
			@Nullable String via) {
	}

	public record ScheduleInfo(
			@Nullable String frequency,
			List<Integer> days) {
	}

	public record TransitTimeInfo(
			@JsonProperty("min_days") @Nullable Integer minDays,
			@JsonProperty("max_days") @Nullable Integer maxDays) {
	}

	public record ExtractionWarning(
			@Nullable String field,
			@Nullable String source,
			@Nullable String message) {
	}
}
