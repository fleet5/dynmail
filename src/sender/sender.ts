/**
 * Creates a new `Sender` to be used in a `dynmail` instance.
 *
 * @param params - The parameters for the sender.
 *
 * @example
 * import { dynmail, sender } from 'dynmail'
 *
 * const mail = dynmail({
 *   sender: sender({
 *     id: 'support',
 *     name: 'Support Team',
 *     email: 'support@myapp.com'
 *   })
 * })
 */
export function sender<const ID extends string>(
  params: SenderConstructorParams<ID> & { id: ID }
): Sender<ID>
export function sender(
  params: SenderConstructorParams<'default'> & { id?: never }
): Sender<'default'>
export function sender<ID extends string = 'default'>(
  params: SenderConstructorParams<ID>
): Sender<ID> {
  return new Sender(params)
}

export class Sender<ID extends string = 'default'> {
  public id: ID
  public name: string
  public email: string

  public constructor(params: SenderConstructorParams<ID>) {
    this.id = params.id ?? ('default' as ID)
    this.name = params.name
    this.email = params.email
  }

  public toString(): string {
    return `${this.name} <${this.email}>`
  }
}

type SenderConstructorParams<ID extends string = 'default'> = {
  /**
   * The identifier for the sender. This is useful when you have multiple
   * senders and need to distinguish between them.
   */
  id?: ID

  /**
   * The sender's name. This is the name that will be displayed in the "From"
   * field of the email.
   */
  name: string

  /**
   * The sender's email address. This is the email address that will be used
   * to send the email.
   */
  email: string
}
