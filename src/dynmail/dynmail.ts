import type { Provider } from '~/provider/provider'
import type { Sender } from '~/sender/sender'
import type { AsyncResult } from '~/util'

/**
 * Creates a Dynmail client with the specified configuration.
 *
 * @example
 * import { dynmail, resend, sender } from 'dynmail'
 *
 * export const mail = dynmail({
 *   providers: [resend()],
 *   from: sender({ email: 'example@myapp.com', name: 'My App' })
 * })
 */
export function dynmail<
  Providers extends readonly Provider<string, string, unknown>[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean = false
>(
  params: DynmailParams<Providers, Senders, SafeMode>
): Dynmail<Providers, Senders, SafeMode> {}

type Dynmail<
  Providers extends readonly Provider<string, string, unknown>[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean = false
> = SafeMode extends true
  ? {
      send: (
        params: DynmailSendMailParams<Providers, Senders>
      ) => AsyncResult<void, ExtractProviderErrors<Providers>>
    }
  : {
      send: (params: DynmailSendMailParams<Providers, Senders>) => Promise<void>
    }

type DynmailSendMailParams<
  Providers extends readonly Provider<string, string, unknown>[],
  Senders extends readonly Sender<string>[]
> = {
  /**
   * The ID of the provider to use for sending the email. If not specified,
   * the 'default' provider will be used. If the default provider is not
   * available, it will use the first provider in the list.
   */
  provider?: Providers[number]['id']

  /**
   * The ID of the sender to use for sending the email. If not specified,
   * the 'default' sender will be used. If the default sender is not available,
   * it will use the first sender in the list.
   */
  from?: Senders[number]['id']

  /**
   * The recipient's email address. This can be a single email address or an
   * array of email addresses.
   */
  to: string | string[]

  /**
   * The CC (carbon copy) recipients of the email. This can be a single email
   * address or an array of email addresses.
   *
   * Carbon copy (CC) recipients will receive a copy of the email, and their
   * email addresses will be visible to all recipients.
   */
  cc?: string | string[]

  /**
   * The BCC (blind carbon copy) recipients of the email. This can be a single
   * email address or an array of email addresses.
   *
   * Blind carbon copy (BCC) recipients will receive a copy of the email,
   * but their email addresses will not be visible to other recipients.
   */
  bcc?: string | string[]

  /**
   * The subject of the email.
   */
  subject: string

  /**
   * The body of the email. This can be a plain text string or an HTML string.
   */
  body: string

  /**
   * The reply-to email address. This can be a single email address or an
   * array of email addresses.
   *
   * If specified, replies to the email will be sent to this address instead
   * of the sender's address.
   */
  replyTo?: string | string[]
}

type ExtractProviderErrors<
  Providers extends readonly Provider<string, string, unknown>[]
> = Providers extends readonly [
  Provider<string, string, infer ErrorType>,
  ...infer Rest
]
  ? Rest extends readonly Provider<string, string, unknown>[]
    ? ErrorType | ExtractProviderErrors<Rest>
    : ErrorType
  : never

type DynmailParams<
  Providers extends readonly Provider<string, string, unknown>[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean = false
> = {
  /**
   * The providers to use for sending emails. If you have multiple providers,
   * you need to ensure that each provider has a unique ID.
   *
   * @example
   * providers: [resend(), ses()]
   */
  providers: ValidateProviders<Providers>

  /**
   * The senders to use for sending emails. If you have multiple senders,
   * you need to ensure that each sender has a unique ID.
   *
   * @example
   * senders: [sender({ email: 'example@myapp.com', name: 'My App' })]
   */
  senders: ValidateSenders<Senders>

  /**
   * Whether to enable safe mode. When enabled, Dynmail won't throw any errors,
   * but will instead return an error object with the status set to 'failure'.
   *
   * @default false
   */
  safe?: SafeMode
}

type ValidateProviders<T> = T extends readonly []
  ? '❌ You must provide at least one provider.'
  : T extends readonly [Provider<string, string, unknown>]
    ? T
    : T extends readonly Provider<string, string, unknown>[]
      ? FindDuplicateIDsOnProviders<T> extends never
        ? T
        : `❌ Duplicate provider ID found: ${FindDuplicateIDsOnProviders<T>}`
      : T

declare const a: ValidateProviders<
  readonly [
    Provider<'default', 'resend', unknown>,
    Provider<'default', 'ses', unknown>
  ]
>

type FindDuplicateIDsOnProviders<
  T extends readonly Provider<string, string, unknown>[]
> = T extends readonly [Provider<infer First, string, unknown>, ...infer Rest]
  ? Rest extends readonly Provider<string, string, unknown>[]
    ? First extends ExtractAllIDsOnProviders<Rest>
      ? First
      : FindDuplicateIDsOnProviders<Rest>
    : never
  : never

type ExtractAllIDsOnProviders<
  T extends readonly Provider<string, string, unknown>[]
> = T extends readonly [Provider<infer K, string, unknown>, ...infer Rest]
  ? Rest extends readonly Provider<string, string, unknown>[]
    ? K | ExtractAllIDsOnProviders<Rest>
    : K
  : never

declare const b: FindDuplicateIDsOnProviders<
  readonly [
    Provider<'default', 'resend', unknown>,
    Provider<'default', 'ses', unknown>
  ]
>

type ValidateSenders<T> = T extends readonly []
  ? '❌ You must provide at least one sender.'
  : T extends readonly [Sender<string>]
    ? T
    : T extends readonly Sender<string>[]
      ? FindDuplicateIDsOnSenders<T> extends never
        ? T
        : `❌ Duplicate sender ID found: ${FindDuplicateIDsOnSenders<T>}`
      : T

type FindDuplicateIDsOnSenders<T extends readonly Sender<string>[]> =
  T extends readonly [Sender<infer First>, ...infer Rest]
    ? Rest extends readonly Sender<string>[]
      ? First extends ExtractAllIDsOnSenders<Rest>
        ? First
        : FindDuplicateIDsOnSenders<Rest>
      : never
    : never

type ExtractAllIDsOnSenders<T extends readonly Sender<string>[]> =
  T extends readonly [Sender<infer K>, ...infer Rest]
    ? Rest extends readonly Sender<string>[]
      ? K | ExtractAllIDsOnSenders<Rest>
      : K
    : never
