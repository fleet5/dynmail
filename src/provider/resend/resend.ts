import { randomUUID } from 'node:crypto'
import { pkg } from '~/pkg'
import { Provider, type SendMailParams } from '../provider'
import { type AnyResendError, createResendError } from './resend-error'

export function resend<const ID extends string>(
  params?: ResendParams<ID> & { id: ID }
): Resend<ID>
export function resend(
  params?: ResendParams<'default'> & { id?: never }
): Resend<'default'>
export function resend<ID extends string = 'default'>(
  params: ResendParams<ID> = {}
): Resend<ID> {
  const apiKey =
    params?.apiKey ??
    (typeof process !== 'undefined' && process.env.RESEND_API_KEY)

  if (!apiKey) {
    throw new Error(
      'Missing API key for Resend provider. Please provide an API key via the `apiKey` parameter or set the `RESEND_API_KEY` environment variable.'
    )
  }

  function parseEmailOptions(sendParams: SendMailParams): ResendSendMailParams {
    return {
      from: sendParams.from,
      to: sendParams.to,
      bcc: sendParams.bcc,
      cc: sendParams.cc,
      reply_to: sendParams.replyTo,
      subject: sendParams.subject,
      html: sendParams.html,
      text: sendParams.text,
      headers: sendParams.headers
    }
  }

  let resolvedApiKey: string | undefined

  return new Provider<ID, 'resend', AnyResendError>({
    id: params.id,
    provider: 'resend',
    send: async (sendParams) => {
      const emailOptions = parseEmailOptions(sendParams)
      const idempotencyKey = randomUUID()

      if (!resolvedApiKey) {
        if (typeof apiKey === 'string') {
          resolvedApiKey = apiKey
        } else {
          const result = apiKey()

          if (result instanceof Promise) {
            resolvedApiKey = await result
          } else {
            resolvedApiKey = result
          }
        }
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resolvedApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
            'User-Agent': `dynmail/${pkg.version}`
          },
          body: JSON.stringify(emailOptions)
        })

        if (!response.ok) {
          const json = await response.json().catch(() => undefined)

          return {
            status: 'failure',
            error: createResendError(
              json?.code || 'unknown_error',
              json?.message,
              response.status
            )
          }
        }

        return { status: 'success' }
      } catch (error) {
        console.error(error)
        return {
          status: 'failure',
          error: createResendError(
            'network_error',
            'An error occurred while sending the email. Please check your network connection and try again.',
            500
          )
        }
      }
    }
  })
}

type Resend<ID extends string = 'default'> = Provider<
  ID,
  'resend',
  AnyResendError
>

type ResendParams<ID extends string = 'default'> = {
  /**
   * The identifier for the Resend provider. This is useful when you have
   * multiple providers and need to distinguish between them.
   */
  id?: ID

  /**
   * The API key for the Resend provider. This is required to authenticate
   * requests to the Resend API.
   *
   * @default process.env.RESEND_API_KEY
   */
  apiKey?: string | (() => string) | (() => Promise<string>) | undefined
}

type ResendSendMailParams = {
  from: string
  to: string | string[]
  bcc?: string | string[]
  cc?: string | string[]
  reply_to?: string | string[]
  subject: string
  html: string
  text?: string
  headers?: Record<string, string>
}
