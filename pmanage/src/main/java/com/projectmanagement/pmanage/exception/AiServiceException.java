package com.projectmanagement.pmanage.exception;

/**
 * Thrown when the AI service (Google Gemini) is unavailable, rate-limited,
 * or returns an unrecoverable error that the caller should surface to the client.
 */
public class AiServiceException extends RuntimeException {

    private final AiErrorType errorType;

    public AiServiceException(String message, AiErrorType errorType) {
        super(message);
        this.errorType = errorType;
    }

    public AiServiceException(String message, AiErrorType errorType, Throwable cause) {
        super(message, cause);
        this.errorType = errorType;
    }

    public AiErrorType getErrorType() {
        return errorType;
    }

    /**
     * Categorises the type of AI failure so the handler can choose
     * the correct HTTP status and user-facing message.
     */
    public enum AiErrorType {
        /** API quota / rate-limit exceeded (HTTP 429 from Google). */
        QUOTA_EXCEEDED,
        /** Invalid or expired API key (HTTP 400 / 401 / 403 from Google). */
        INVALID_API_KEY,
        /** The AI model returned an unusable / empty response. */
        EMPTY_RESPONSE,
        /** Network timeout or transient infrastructure failure. */
        SERVICE_UNAVAILABLE,
        /** Catch-all for any other unexpected error. */
        UNKNOWN
    }
}
