import { expect, it } from 'bun:test'
import { sender } from '~/sender/sender'
import { resend } from './resend'
import { ResendError } from './resend-error'

it('should throw an error if no API key is provided', () => {
  expect(() => resend({ apiKey: '' })).toThrow(
    'Missing API key for Resend provider. Please provide an API key via the `apiKey` parameter or set the `RESEND_API_KEY` environment variable.'
  )
})

it('should resolve the api key when provided as a promise', async () => {
  const apiKey = () => Promise.resolve(process.env.RESEND_API_KEY ?? '')
  const client = resend({ apiKey })

  const result = await client.send({
    from: sender({
      email: process.env.RESEND_EMAIL_FROM ?? '',
      name: process.env.RESEND_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.RESEND_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})

it('should resolve the api key when provided as a function', async () => {
  const apiKey = () => process.env.RESEND_API_KEY ?? ''
  const client = resend({ apiKey })

  const result = await client.send({
    from: sender({
      email: process.env.RESEND_EMAIL_FROM ?? '',
      name: process.env.RESEND_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.RESEND_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})

it('should return an error if the API key is invalid', async () => {
  const client = resend({
    apiKey: 're_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  })

  const result = await client.send({
    from: sender({
      email: process.env.RESEND_EMAIL_FROM ?? '',
      name: process.env.RESEND_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.RESEND_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({
    status: 'failure',
    error: new ResendError(
      'API key is invalid',
      400,
      'unknown_error',
      'Please check the Resend documentation for more information.'
    )
  })
})
