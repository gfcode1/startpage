import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useActiveBoardId, useKanbanSetActiveBoard, useKanbanBoards } from '@/stores/kanban-store'
import { KanbanBoard } from './components/KanbanBoard'

export default function KanbanApp() {
  const { boardId } = useParams<{ boardId?: string }>()
  const navigate = useNavigate()
  const activeBoardId = useActiveBoardId()
  const boards = useKanbanBoards()
  const setActiveBoard = useKanbanSetActiveBoard()

  useEffect(() => {
    if (boardId && boards.some((b) => b.id === boardId)) {
      setActiveBoard(boardId)
    }
  }, [boardId, boards, setActiveBoard])

  useEffect(() => {
    if (activeBoardId) {
      navigate(`/kanban/${activeBoardId}`, { replace: true })
    }
  }, [activeBoardId, navigate])

  return <KanbanBoard />
}
