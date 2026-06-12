import { useState, useEffect, useRef, useCallback } from 'react'

export function useNoteEditor(
  editingNoteId: string | null,
  onSave: (id: string, title: string, content: string) => void,
) {
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editingNoteId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      onSave(editingNoteId, editorTitle, editorContent)
      setSaveStatus('saved')
    }, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [editorTitle, editorContent, editingNoteId, onSave])

  const resetEditor = useCallback(() => {
    setEditorTitle('')
    setEditorContent('')
    setSaveStatus('idle')
  }, [])

  const loadNote = useCallback((title: string, content: string) => {
    setEditorTitle(title)
    setEditorContent(content)
    setSaveStatus('saved')
  }, [])

  const handleTitleChange = useCallback((value: string) => {
    setEditorTitle(value)
    setSaveStatus('saving')
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    setSaveStatus('saving')
  }, [])

  return {
    editorTitle,
    editorContent,
    saveStatus,
    setEditorContent,
    resetEditor,
    loadNote,
    handleTitleChange,
    handleContentChange,
  }
}
