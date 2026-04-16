export type PagedResponse<T> = {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type PageParams = {
  limit: number
  offset: number
  order: string
  dir: 'asc' | 'desc'
  search?: string
}
