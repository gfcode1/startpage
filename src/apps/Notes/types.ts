export interface Note {
  id: string
  title: string
  content: string
  folder: string
  tags: string[]
  pinned: boolean
  archived: boolean
  deletedAt: number | null
  createdAt: number
  updatedAt: number
}
