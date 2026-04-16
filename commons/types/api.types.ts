export type PagedResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type PageParams = {
  limit?: number   // default 20, max 100
  offset?: number  // default 0
  order?: string   // default 'created_at'
  dir?: 'asc' | 'desc'
  search?: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
