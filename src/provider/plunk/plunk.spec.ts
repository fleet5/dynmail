import { expect, it } from 'bun:test'
import { sender } from '~/sender/sender'
import { plunk } from './plunk'
import { MalformedAuthorizationHeaderError } from './plunk-error'

it('should throw an error if no API key is provided', () => {
  expect(() => plunk({ apiKey: '' })).toThrow(
    'Missing API key for Plunk provider. Please provide an API key via the `apiKey` parameter or set the `PLUNK_API_KEY` environment variable.'
  )
})

it('should send a email', async () => {
  const client = plunk()

  const result = await client.send({
    from: sender({
      email: process.env.PLUNK_EMAIL_FROM ?? '',
      name: process.env.PLUNK_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.PLUNK_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})

it('should resolve the api key when provided as a promise', async () => {
  const apiKey = () => Promise.resolve(process.env.PLUNK_API_KEY ?? '')
  const client = plunk({ apiKey })

  const result = await client.send({
    from: sender({
      email: process.env.PLUNK_EMAIL_FROM ?? '',
      name: process.env.PLUNK_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.PLUNK_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})

it('should resolve the api key when provided as a function', async () => {
  const apiKey = () => process.env.PLUNK_API_KEY ?? ''
  const client = plunk({ apiKey })

  const result = await client.send({
    from: sender({
      email: process.env.PLUNK_EMAIL_FROM ?? '',
      name: process.env.PLUNK_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.PLUNK_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})

it('should return an error if the API key is invalid', async () => {
  const client = plunk({
    apiKey: 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  })

  const result = await client.send({
    from: sender({
      email: process.env.PLUNK_EMAIL_FROM ?? '',
      name: process.env.PLUNK_EMAIL_FROM_NAME ?? 'Dynmail Test'
    }),
    to: process.env.PLUNK_EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({
    status: 'failure',
    error: new MalformedAuthorizationHeaderError(
      'Incorrect Bearer token specified'
    )
  })
})
