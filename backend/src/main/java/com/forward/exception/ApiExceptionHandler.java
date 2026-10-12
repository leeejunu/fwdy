package com.forward.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(MailAnalysisException.class)
	public ProblemDetail handleMailAnalysisFailure(MailAnalysisException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, exception.getMessage());
	}

	@ExceptionHandler(QuoteAnalysisNotFoundException.class)
	public ProblemDetail handleQuoteAnalysisNotFound(QuoteAnalysisNotFoundException exception) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail handleValidationFailure(MethodArgumentNotValidException exception) {
		String detail = exception.getBindingResult().getAllErrors().stream()
				.findFirst()
				.map(ObjectError::getDefaultMessage)
				.orElse("요청 값이 올바르지 않습니다.");
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ProblemDetail handleUnreadableRequest() {
		return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 본문이 올바른 JSON 형식이 아닙니다.");
	}
}
