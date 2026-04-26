export type BoardKind = 'NOTICE' | 'COMMUNITY' | 'QA' | 'FAQ' | 'GALLERY'
export type BoardStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'HIDDEN'

export type BoardConfig = {
  id: number
  code: string
  kind: BoardKind
  displayName: string
  description: string | null
  allowCustomerWrite: boolean
  allowComment: boolean
  isActive: boolean
  sortOrder: number
}

export type BoardSummary = {
  id: number
  title: string
  authorName: string | null
  status: BoardStatus
  isPinned: boolean
  isAnswered: boolean
  viewCount: number
  createdAt: string
}

export type BoardDetail = {
  id: number
  boardConfigId: number
  boardConfigCode: string
  title: string
  content: string | null
  authorName: string | null
  status: BoardStatus
  isPinned: boolean
  isAnswered: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

// Page response from Spring
export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number  // current page (0-based)
  size: number
}
