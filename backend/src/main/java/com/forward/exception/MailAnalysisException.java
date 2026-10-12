package com.forward.exception;

public class MailAnalysisException extends RuntimeException {
	public MailAnalysisException(String message) {
		super(message);
	}

	public MailAnalysisException(String message, Throwable cause) {
		super(message, cause);
	}
}
