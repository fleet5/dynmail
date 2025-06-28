import { expect, it } from 'bun:test'
import { resend } from './resend'

it('should send a email', async () => {
  const client = resend()

  const result = await client.send({
    from: process.env.EMAIL_FROM ?? '',
    to: process.env.EMAIL_TARGET ?? '',
    subject: 'Test Email',
    html: '<h1>Hello World</h1>'
  })

  expect(result).toEqual({ status: 'success' })
})
