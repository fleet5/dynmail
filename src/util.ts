export type Result<Success, Failure> =
  | {
      status: 'failure'
      error: Failure
      data?: never
    }
  | (Success extends void
      ? { status: 'success'; data?: undefined; error?: never }
      : { status: 'success'; data: Success; error?: never })

export type AsyncResult<Success, Failure> = Promise<Result<Success, Failure>>
