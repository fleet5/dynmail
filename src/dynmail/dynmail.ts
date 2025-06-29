import {
  type Attachment,
  AttachmentNotSupportedByProviderError,
  type Provider,
  ProviderNotFoundError
} from '~/provider/provider'
import { type Sender, SenderNotFoundError } from '~/sender/sender'
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
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean = false
>(
  params: DynmailParams<Providers, Senders, SafeMode>
): Dynmail<Providers, Senders, SafeMode> {
  const { providers, senders, safe = false } = params

  if (
    typeof providers === 'string' ||
    !Array.isArray(providers) ||
    providers.length === 0
  ) {
    throw new Error('❌ You must provide at least one provider.')
  }

  if (
    typeof senders === 'string' ||
    !Array.isArray(senders) ||
    senders.length === 0
  ) {
    throw new Error('❌ You must provide at least one sender.')
  }

  const send = async (params: DynmailSendMailParams<Providers, Senders>) => {
    const providerId = params.provider ?? 'default'

    const provider =
      (providers as Providers).find((p) => p.id === providerId) ||
      (providers as Providers)[0]

    if (!provider) {
      const error = new ProviderNotFoundError(providerId)
      if (safe) {
        return {
          status: 'failure' as const,
          error
        }
      }
      throw error
    }

    if (
      typeof params.attachments === 'string' ||
      (!provider.options.supportsAttachments &&
        Array.isArray(params.attachments) &&
        (params.attachments as Attachment[]).length > 0)
    ) {
      const error = new AttachmentNotSupportedByProviderError(providerId)
      if (safe) {
        return {
          status: 'failure' as const,
          error
        }
      }
      throw error
    }

    const senderId = params.from ?? 'default'

    const sender =
      (senders as Senders).find((s) => s.id === senderId) ||
      (senders as Senders)[0]

    if (!sender) {
      const error = new SenderNotFoundError(senderId)
      if (safe) {
        return {
          status: 'failure' as const,
          error
        }
      }
      throw error
    }

    return provider.send({
      from: sender,
      to: params.to,
      html: params.body,
      subject: params.subject,
      bcc: params.bcc,
      attachments: params.attachments,
      cc: params.cc,
      headers: params.headers,
      replyTo: params.replyTo
    })
  }

  if (safe) {
    const client = {
      send
    } as Dynmail<Providers, Senders, true>

    for (const provider of providers as Providers) {
      if (provider.id === 'default') {
        continue
      }
      // Dynamic property assignment for provider methods
      ;(client as Record<string, unknown>)[provider.id] = {
        send: (
          params: Omit<
            DynmailSendMailParamsForSpecificProvider<
              Providers,
              Senders,
              string
            >,
            'provider'
          >
        ) =>
          send({
            ...params,
            provider: provider.id
          } as DynmailSendMailParams<Providers, Senders>)
      }
    }

    for (const sender of senders as Senders) {
      if (sender.id === 'default') {
        continue
      }
      // Dynamic property assignment for sender methods
      ;(client as Record<string, unknown>)[sender.id] = {
        send: (
          params: Omit<DynmailSendMailParams<Providers, Senders>, 'from'>
        ) =>
          send({
            ...params,
            from: sender.id
          })
      }
    }

    return client as Dynmail<Providers, Senders, SafeMode>
  } else {
    const client = {
      send: async (params: DynmailSendMailParams<Providers, Senders>) => {
        const result = await send(params)
        if (result.status === 'failure') {
          throw result.error
        }
      }
    } as Dynmail<Providers, Senders, false>

    for (const provider of providers as Providers) {
      if (provider.id === 'default') {
        continue
      }
      // Dynamic property assignment for provider methods
      ;(client as Record<string, unknown>)[provider.id] = {
        send: async (
          params: Omit<
            DynmailSendMailParamsForSpecificProvider<
              Providers,
              Senders,
              string
            >,
            'provider'
          >
        ) => {
          const result = await send({
            ...params,
            provider: provider.id
          } as DynmailSendMailParams<Providers, Senders>)
          if (result.status === 'failure') {
            throw result.error
          }
        }
      }
    }

    for (const sender of senders as Senders) {
      if (sender.id === 'default') {
        continue
      }
      // Dynamic property assignment for sender methods
      ;(client as Record<string, unknown>)[sender.id] = {
        send: async (
          params: Omit<DynmailSendMailParams<Providers, Senders>, 'from'>
        ) => {
          const result = await send({
            ...params,
            from: sender.id
          })
          if (result.status === 'failure') {
            throw result.error
          }
        }
      }
    }

    return client as Dynmail<Providers, Senders, SafeMode>
  }
}

type Dynmail<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean = false
> = SafeMode extends true
  ? {
      /**
       * Sends an email with the specified parameters.
       *
       * @param params The parameters for sending the email.
       * @returns A promise that resolves with a status of 'success' or
       * 'failure'.
       */
      send(
        params: DynmailSendMailParams<Providers, Senders>
      ): AsyncResult<void, ExtractProviderErrors<Providers>>
    } & CreateProviderMethods<Providers, Senders, SafeMode> &
      CreateSenderMethods<Providers, Senders, SafeMode>
  : {
      /**
       * Sends an email with the specified parameters.
       *
       * @param params The parameters for sending the email.
       * @returns A promise that resolves when the email is sent successfully.
       * @throws {Error} If there is an error while sending the email.
       */
      send(params: DynmailSendMailParams<Providers, Senders>): Promise<void>
    } & CreateProviderMethods<Providers, Senders, SafeMode> &
      CreateSenderMethods<Providers, Senders, SafeMode>

type DynmailSendMailParams<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
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

  /**
   * File attachments to include with the email. This property is only
   * available when using providers that support attachments.
   */
  attachments?: CheckProvidersForAttachmentSupport<Providers>

  /**
   * Custom headers to include in the email. This can be used to add
   * additional metadata or information to the email.
   */
  headers?: Record<string, string>
}

type ExtractProviderErrors<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[]
> = Providers extends readonly [
  Provider<string, string, infer ErrorType, { supportsAttachments: boolean }>,
  ...infer Rest
]
  ? Rest extends readonly Provider<
      string,
      string,
      unknown,
      { supportsAttachments: boolean }
    >[]
    ? ErrorType | ExtractProviderErrors<Rest>
    : ErrorType
  : never

type DynmailParams<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
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
  : T extends readonly [
        Provider<string, string, unknown, { supportsAttachments: boolean }>
      ]
    ? T
    : T extends readonly Provider<
          string,
          string,
          unknown,
          { supportsAttachments: boolean }
        >[]
      ? FindDuplicateIDsOnProviders<T> extends never
        ? T
        : `❌ Duplicate provider ID found: ${FindDuplicateIDsOnProviders<T>}`
      : T

type FindDuplicateIDsOnProviders<
  T extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[]
> = T extends readonly [
  Provider<infer First, string, unknown, { supportsAttachments: boolean }>,
  ...infer Rest
]
  ? Rest extends readonly Provider<
      string,
      string,
      unknown,
      { supportsAttachments: boolean }
    >[]
    ? First extends ExtractAllIDsOnProviders<Rest>
      ? First
      : FindDuplicateIDsOnProviders<Rest>
    : never
  : never

type ExtractAllIDsOnProviders<
  T extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[]
> = T extends readonly [
  Provider<infer K, string, unknown, { supportsAttachments: boolean }>,
  ...infer Rest
]
  ? Rest extends readonly Provider<
      string,
      string,
      unknown,
      { supportsAttachments: boolean }
    >[]
    ? K | ExtractAllIDsOnProviders<Rest>
    : K
  : never

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

type CreateProviderMethods<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean
> = {
  [K in ExtractNonDefaultProviderIDs<Providers>]: SafeMode extends true
    ? {
        send(
          params: Omit<
            DynmailSendMailParamsForSpecificProvider<Providers, Senders, K>,
            'provider'
          >
        ): AsyncResult<void, ExtractProviderErrors<Providers>>
      }
    : {
        send(
          params: Omit<
            DynmailSendMailParamsForSpecificProvider<Providers, Senders, K>,
            'provider'
          >
        ): Promise<void>
      }
}

type CreateSenderMethods<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  Senders extends readonly Sender<string>[],
  SafeMode extends boolean
> = {
  [K in ExtractNonDefaultSenderIDs<Senders>]: SafeMode extends true
    ? {
        /**
         * Sends an email with the specified parameters using the specified sender.
         *
         * @param params The parameters for sending the email.
         * @returns A promise that resolves with a status of 'success' or
         * 'failure'.
         */
        send: (
          params: Omit<DynmailSendMailParams<Providers, Senders>, 'from'>
        ) => AsyncResult<void, ExtractProviderErrors<Providers>>
      }
    : {
        /**
         * Sends an email with the specified parameters using the specified sender.
         *
         * @param params The parameters for sending the email.
         * @returns A promise that resolves when the email is sent successfully.
         * @throws {Error} If there is an error while sending the email.
         */
        send: (
          params: Omit<DynmailSendMailParams<Providers, Senders>, 'from'>
        ) => Promise<void>
      }
}

type ExtractNonDefaultProviderIDs<
  T extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[]
> = T extends readonly [
  Provider<infer K, string, unknown, { supportsAttachments: boolean }>,
  ...infer Rest
]
  ? Rest extends readonly Provider<
      string,
      string,
      unknown,
      { supportsAttachments: boolean }
    >[]
    ? K extends 'default'
      ? ExtractNonDefaultProviderIDs<Rest>
      : K | ExtractNonDefaultProviderIDs<Rest>
    : K extends 'default'
      ? never
      : K
  : never

type ExtractNonDefaultSenderIDs<T extends readonly Sender<string>[]> =
  T extends readonly [Sender<infer K>, ...infer Rest]
    ? Rest extends readonly Sender<string>[]
      ? K extends 'default'
        ? ExtractNonDefaultSenderIDs<Rest>
        : K | ExtractNonDefaultSenderIDs<Rest>
      : K extends 'default'
        ? never
        : K
    : never

type CheckProvidersForAttachmentSupport<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[]
> = Providers extends readonly [
  Provider<string, string, unknown, infer Options>,
  ...infer Rest
]
  ? Options extends { supportsAttachments: true }
    ? Attachment[]
    : Rest extends readonly Provider<
          string,
          string,
          unknown,
          { supportsAttachments: boolean }
        >[]
      ? CheckProvidersForAttachmentSupport<Rest>
      : '❌ None of your providers support attachments. Please use a provider that supports attachments (like Resend) to send emails with attachments.'
  : '❌ None of your providers support attachments. Please use a provider that supports attachments (like Resend) to send emails with attachments.'

type CheckSpecificProviderForAttachmentSupport<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  ProviderID extends string
> = Providers extends readonly [
  Provider<infer CurrentID, string, unknown, infer Options>,
  ...infer Rest
]
  ? CurrentID extends ProviderID
    ? Options extends { supportsAttachments: true }
      ? Attachment[]
      : `❌ The provider '${ProviderID}' does not support attachments. Please use a provider that supports attachments (like Resend) to send emails with attachments.`
    : Rest extends readonly Provider<
          string,
          string,
          unknown,
          { supportsAttachments: boolean }
        >[]
      ? CheckSpecificProviderForAttachmentSupport<Rest, ProviderID>
      : `❌ Provider '${ProviderID}' not found.`
  : `❌ Provider '${ProviderID}' not found.`

type DynmailSendMailParamsForSpecificProvider<
  Providers extends readonly Provider<
    string,
    string,
    unknown,
    { supportsAttachments: boolean }
  >[],
  Senders extends readonly Sender<string>[],
  ProviderID extends string
> = {
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

  /**
   * File attachments to include with the email. This property is only
   * available when the specific provider being used supports attachments.
   * If the provider doesn't support attachments, TypeScript will show
   * a descriptive error message.
   */
  attachments?: CheckSpecificProviderForAttachmentSupport<Providers, ProviderID>
}
