export function createPlunkError(
  statusCode: number,
  message: string
): PlunkError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message)
    case 401:
      if (message.includes('No authorization header')) {
        return new MissingAuthorizationHeaderError()
      }
      if (message.includes('Bearer')) {
        return new MalformedAuthorizationHeaderError(message)
      }
      if (message.includes('API key could not be parsed')) {
        return new InvalidApiKeyFormatError(message)
      }
      if (message.includes('secret key')) {
        return new InvalidSecretKeyError(message)
      }
      if (message.includes('public key')) {
        return new InvalidPublicKeyError(message)
      }
      if (message.includes('Incorrect Bearer token')) {
        return new IncorrectBearerTokenError()
      }
      if (message.includes('Verify your domain')) {
        return new DomainNotVerifiedError()
      }
      if (message.includes('Custom from address')) {
        return new InvalidFromDomainError()
      }
      return new UnauthorizedError(message)
    case 403:
      return new ForbiddenError(message)
    case 404:
      if (message.includes('project')) {
        return new ProjectNotFoundError()
      }
      return new NotFoundError(message)
    case 422:
      return new UnprocessableEntityError(message)
    case 429:
      return new RateLimitExceededError()
    case 500:
      return new InternalServerError()
    default:
      return new PlunkError(message, statusCode)
  }
}

export class PlunkError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly suggestion?: string
  ) {
    super(message)
    this.name = 'PlunkError'
  }
}

export class ValidationError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      400,
      'validation_error',
      'Please check your request data and ensure all required fields are correctly formatted.'
    )
  }
}

export class MissingAuthorizationHeaderError extends PlunkError {
  constructor() {
    super(
      'No authorization header passed',
      401,
      'missing_authorization_header',
      'Include the Authorization header: "Authorization: Bearer sk_your_secret_key"'
    )
  }
}

export class MalformedAuthorizationHeaderError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      401,
      'malformed_authorization_header',
      'Ensure your authorization header follows the format: "Bearer sk_your_secret_key"'
    )
  }
}

export class InvalidApiKeyFormatError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      401,
      'invalid_api_key_format',
      'API keys must start with "sk_" for secret keys or "pk_" for public keys'
    )
  }
}

export class InvalidSecretKeyError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      401,
      'invalid_secret_key',
      'Secret keys must start with "sk_" and be passed as Bearer sk_your_secret_key'
    )
  }
}

export class InvalidPublicKeyError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      401,
      'invalid_public_key',
      'Public keys must start with "pk_" and be passed as Bearer pk_your_public_key'
    )
  }
}

export class IncorrectBearerTokenError extends PlunkError {
  constructor() {
    super(
      'Incorrect Bearer token specified',
      401,
      'incorrect_bearer_token',
      'Verify your API key is correct and has not been regenerated'
    )
  }
}

export class DomainNotVerifiedError extends PlunkError {
  constructor() {
    super(
      'Verify your domain before you start sending',
      401,
      'domain_not_verified',
      'Complete domain verification in your Plunk dashboard before sending emails'
    )
  }
}

export class InvalidFromDomainError extends PlunkError {
  constructor() {
    super(
      'Custom from address must be from a verified domain',
      401,
      'invalid_from_domain',
      'The from address must use the same domain as verified in your project settings'
    )
  }
}

export class UnauthorizedError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      401,
      'unauthorized',
      'Check your authentication credentials and permissions'
    )
  }
}

export class ForbiddenError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      403,
      'forbidden',
      'You do not have permission to perform this action'
    )
  }
}

export class ProjectNotFoundError extends PlunkError {
  constructor() {
    super(
      'That project was not found',
      404,
      'project_not_found',
      'Ensure the project exists and you have access to it'
    )
  }
}

export class NotFoundError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      404,
      'not_found',
      'The requested resource could not be found'
    )
  }
}

export class UnprocessableEntityError extends PlunkError {
  constructor(message: string) {
    super(
      message,
      422,
      'unprocessable_entity',
      'Review the request data format and field requirements'
    )
  }
}

export class RateLimitExceededError extends PlunkError {
  constructor() {
    super(
      'Rate limit exceeded',
      429,
      'rate_limit_exceeded',
      'Reduce your request frequency or contact support to increase your rate limit'
    )
  }
}

export class InternalServerError extends PlunkError {
  constructor() {
    super(
      'An unexpected error occurred',
      500,
      'internal_server_error',
      'Try the request again later. If the error persists, contact support'
    )
  }
}

export type AnyPlunkError =
  | ValidationError
  | MissingAuthorizationHeaderError
  | MalformedAuthorizationHeaderError
  | InvalidApiKeyFormatError
  | InvalidSecretKeyError
  | InvalidPublicKeyError
  | IncorrectBearerTokenError
  | DomainNotVerifiedError
  | InvalidFromDomainError
  | UnauthorizedError
  | ForbiddenError
  | ProjectNotFoundError
  | NotFoundError
  | UnprocessableEntityError
  | RateLimitExceededError
  | InternalServerError
  | PlunkError
