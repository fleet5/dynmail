import { expect, it } from 'bun:test'
import { sender } from './sender'

it('should create a default sender when no ID is provided', () => {
  const johnDoe = sender({
    name: 'John Doe',
    email: 'john.doe@example.com'
  })

  expect(johnDoe.id).toBe('default')
})

it('should return the correct string representation', () => {
  const janeDoe = sender({
    id: 'jane',
    name: 'Jane Doe',
    email: 'jane.doe@example.com'
  })

  expect(janeDoe.toString()).toBe('Jane Doe <jane.doe@example.com>')
})
