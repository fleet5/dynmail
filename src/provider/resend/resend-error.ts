export function createResendError(
  code: string,
  message?: string,
  statusCode?: number
): ResendError {
  switch (code) {
    case 'invalid_idempotency_key':
      return new InvalidIdempotencyKeyError()
    case 'validation_error':
      return new ValidationError(message)
    case 'missing_api_key':
      return new MissingApiKeyError()
    case 'restricted_api_key':
      return new RestrictedApiKeyError()
    case 'invalid_api_key':
      return new InvalidApiKeyError()
    case 'not_found':
      return new NotFoundError()
    case 'method_not_allowed':
      return new MethodNotAllowedError()
    case 'invalid_idempotent_request':
      return new InvalidIdempotentRequestError()
    case 'concurrent_idempotent_requests':
      return new ConcurrentIdempotentRequestsError()
    case 'invalid_attachment':
      return new InvalidAttachmentError()
    case 'invalid_from_address':
      return new InvalidFromAddressError()
    case 'invalid_access':
      return new InvalidAccessError()
    case 'invalid_parameter':
      return new InvalidParameterError('parameter')
    case 'invalid_region':
      return new InvalidRegionError()
    case 'missing_required_field':
      return new MissingRequiredFieldError()
    case 'daily_quota_exceeded':
      return new DailyQuotaExceededError()
    case 'rate_limit_exceeded':
      return new RateLimitExceededError()
    case 'security_error':
      return new SecurityError(message)
    case 'application_error':
      return new ApplicationError()
    case 'internal_server_error':
      return new InternalServerError()
    default:
      return new ResendError(
        message || 'Unknown error occurred',
        statusCode || 500,
        code,
        'Please check the Resend documentation for more information.'
      )
  }
}

export class ResendError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly suggestion: string
  ) {
    super(message)
    this.name = 'ResendError'
  }
}

export class InvalidIdempotencyKeyError extends ResendError {
  constructor() {
    super(
      'The key must be between 1-256 chars.',
      400,
      'invalid_idempotency_key',
      'Retry with a valid idempotency key.'
    )
  }
}

export class ValidationError extends ResendError {
  constructor(
    message = 'We found an error with one or more fields in the request.'
  ) {
    super(
      message,
      400,
      'validation_error',
      'The message will contain more details about what field and error were found.'
    )
  }
}

// 401 Errors
export class MissingApiKeyError extends ResendError {
  constructor() {
    super(
      'Missing API key in the authorization header.',
      401,
      'missing_api_key',
      'Include the following header in the request: `Authorization: Bearer YOUR_API_KEY`.'
    )
  }
}

export class RestrictedApiKeyError extends ResendError {
  constructor() {
    super(
      'This API key is restricted to only send emails.',
      401,
      'restricted_api_key',
      'Make sure the API key has `Full access` to perform actions other than sending emails.'
    )
  }
}

// 403 Errors
export class InvalidApiKeyError extends ResendError {
  constructor() {
    super(
      'API key is invalid.',
      403,
      'invalid_api_key',
      'Make sure the API key is correct or generate a new API key in the dashboard.'
    )
  }
}

export class TestingModeValidationError extends ResendError {
  constructor(email: string) {
    super(
      `You can only send testing emails to your own email address (${email}).`,
      403,
      'validation_error',
      "In Resend's Domain page, add and verify a domain for which you have DNS access. This allows you to send emails to addresses beyond your own."
    )
  }
}

export class NotFoundError extends ResendError {
  constructor() {
    super(
      'The requested endpoint does not exist.',
      404,
      'not_found',
      'Change your request URL to match a valid API endpoint.'
    )
  }
}

export class MethodNotAllowedError extends ResendError {
  constructor() {
    super(
      'Method is not allowed for the requested path.',
      405,
      'method_not_allowed',
      'Change your API endpoint to use a valid method.'
    )
  }
}

export class InvalidIdempotentRequestError extends ResendError {
  constructor() {
    super(
      'Same idempotency key used with a different request payload.',
      409,
      'invalid_idempotent_request',
      'Change your idempotency key or payload.'
    )
  }
}

export class ConcurrentIdempotentRequestsError extends ResendError {
  constructor() {
    super(
      'Same idempotency key used while original request is still in progress.',
      409,
      'concurrent_idempotent_requests',
      'Try the request again later.'
    )
  }
}

export class InvalidAttachmentError extends ResendError {
  constructor() {
    super(
      'Attachment must have either a `content` or `path`.',
      422,
      'invalid_attachment',
      'Attachments must either have a `content` (strings, Buffer, or Stream contents) or `path` to a remote resource (better for larger attachments).'
    )
  }
}

export class InvalidFromAddressError extends ResendError {
  constructor() {
    super(
      'Invalid `from` field.',
      422,
      'invalid_from_address',
      'Make sure the `from` field is a valid. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.'
    )
  }
}

export class InvalidAccessError extends ResendError {
  constructor() {
    super(
      'Access must be "full_access" | "sending_access".',
      422,
      'invalid_access',
      'Make sure the API key has necessary permissions.'
    )
  }
}

export class InvalidParameterError extends ResendError {
  constructor(parameter: string) {
    super(
      `The ${parameter} must be a valid UUID.`,
      422,
      'invalid_parameter',
      "Check the value and make sure it's valid."
    )
  }
}

export class InvalidRegionError extends ResendError {
  constructor() {
    super(
      'Region must be "us-east-1" | "eu-west-1" | "sa-east-1".',
      422,
      'invalid_region',
      'Make sure the correct region is selected.'
    )
  }
}

export class MissingRequiredFieldError extends ResendError {
  constructor(fields?: string[]) {
    const fieldsList = fields ? `: ${fields.join(', ')}` : ''
    super(
      `The request body is missing one or more required fields${fieldsList}.`,
      422,
      'missing_required_field',
      'Check the error message to see the list of missing fields.'
    )
  }
}

export class DailyQuotaExceededError extends ResendError {
  constructor() {
    super(
      'You have reached your daily email sending quota.',
      429,
      'daily_quota_exceeded',
      'Upgrade your plan to remove the daily quota limit or wait until 24 hours have passed to continue sending.'
    )
  }
}

export class RateLimitExceededError extends ResendError {
  constructor() {
    super(
      'Too many requests. Please limit the number of requests per second. Or contact support to increase rate limit.',
      429,
      'rate_limit_exceeded',
      'You should read the response headers and reduce the rate at which you request the API. This can be done by introducing a queue mechanism or reducing the number of concurrent requests per second. If you have specific requirements, contact support to request a rate increase.'
    )
  }
}

export class SecurityError extends ResendError {
  constructor(
    message = 'We may have found a security issue with the request.'
  ) {
    super(
      message,
      451,
      'security_error',
      'The message will contain more details. Contact support for more information.'
    )
  }
}

export class ApplicationError extends ResendError {
  constructor() {
    super(
      'An unexpected error occurred.',
      500,
      'application_error',
      'Try the request again later. If the error does not resolve, check our status page for service updates.'
    )
  }
}

export class InternalServerError extends ResendError {
  constructor() {
    super(
      'An unexpected error occurred.',
      500,
      'internal_server_error',
      'Try the request again later. If the error does not resolve, check our status page for service updates.'
    )
  }
}

export type AnyResendError =
  | InvalidIdempotencyKeyError
  | ValidationError
  | MissingApiKeyError
  | RestrictedApiKeyError
  | InvalidApiKeyError
  | TestingModeValidationError
  | NotFoundError
  | MethodNotAllowedError
  | InvalidIdempotentRequestError
  | ConcurrentIdempotentRequestsError
  | InvalidAttachmentError
  | InvalidFromAddressError
  | InvalidAccessError
  | InvalidParameterError
  | InvalidRegionError
  | MissingRequiredFieldError
  | DailyQuotaExceededError
  | RateLimitExceededError
  | SecurityError
  | ApplicationError
  | InternalServerError
  | ResendError
