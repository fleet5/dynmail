import type { Sender } from '~/sender/sender'
import type { AsyncResult } from '~/util'

export class Provider<
  ID extends string = 'default',
  Provider extends string = 'none',
  TError = unknown,
  TOptions extends ProviderOptions = ProviderOptions
> {
  public id: ID
  public provider: Provider
  public options: TOptions
  public send: (params: SendMailParams<TOptions>) => AsyncResult<void, TError>

  public constructor(
    params: ProviderConstructorParams<ID, Provider, TError, TOptions>
  ) {
    this.id = params.id ?? ('default' as ID)
    this.provider = params.provider ?? ('none' as Provider)
    this.options = params.options
    this.send = params.send
  }
}

export class ProviderNotFoundError extends Error {
  public constructor(
    providerId: string,
    message = `Provider with ID '${providerId}' not found.`
  ) {
    super(message)
    this.name = 'ProviderNotFoundError'
  }
}

export class AttachmentNotSupportedByProviderError extends Error {
  public constructor(
    providerId: string,
    message = `Provider with ID '${providerId}' does not support attachments.`
  ) {
    super(message)
    this.name = 'AttachmentNotSupportedByProviderError'
  }
}

export type ProviderOptions = {
  supportsAttachments: boolean
}

export type Attachment = {
  filename: string
  content?: string | Buffer
  path?: string
  contentType?: string
}

type ProviderConstructorParams<
  ID extends string = 'default',
  Provider extends string = 'none',
  TError = unknown,
  TOptions extends ProviderOptions = ProviderOptions
> = {
  /**
   * The identifier for the provider. This is useful when you have multiple
   * providers and need to distinguish between them.
   */
  id?: ID

  /**
   * The name of the provider. This is useful for logging and debugging.
   */
  provider?: Provider

  /**
   * The options for the provider, including capabilities like attachment support.
   */
  options: TOptions

  /*
   * The function that will be used to send the email. It should return a
   * Promise that resolves to a Result type.
   */
  send: (params: SendMailParams<TOptions>) => AsyncResult<void, TError>
}

export type SendMailParams<TOptions extends ProviderOptions = ProviderOptions> =
  {
    from: Sender<string>
    to: string | string[]
    subject: string
    html: string
    text?: string
    bcc?: string | string[]
    cc?: string | string[]
    replyTo?: string | string[]
    headers?: Record<string, string>
  } & (TOptions['supportsAttachments'] extends true
    ? { attachments?: Attachment[] }
    : { attachments?: never })
