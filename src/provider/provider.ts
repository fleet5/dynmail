import type { Sender } from '~/sender/sender'
import type { AsyncResult } from '~/util'

export class Provider<
  ID extends string = 'default',
  Provider extends string = 'none',
  TError = unknown
> {
  public id: ID
  public provider: Provider
  public send: (params: SendMailParams) => AsyncResult<void, TError>

  public constructor(params: ProviderConstructorParams<ID, Provider, TError>) {
    this.id = params.id ?? ('default' as ID)
    this.provider = params.provider ?? ('none' as Provider)
    this.send = params.send
  }
}

type ProviderConstructorParams<
  ID extends string = 'default',
  Provider extends string = 'none',
  TError = unknown
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

  /*
   * The function that will be used to send the email. It should return a
   * Promise that resolves to a Result type.
   */
  send: (params: SendMailParams) => AsyncResult<void, TError>
}

export type SendMailParams = {
  from: Sender
  to: string | string[]
  subject: string
  html: string
  text?: string
  bcc?: string | string[]
  cc?: string | string[]
  replyTo?: string | string[]
  headers?: Record<string, string>
}
