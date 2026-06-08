import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider } from '../../framework/ToastContext'
import { TopbarProvider } from '../../framework/TopbarContext'
import TodoApp from './TodoApp'

function renderWithProviders() {
  return render(
    <TopbarProvider>
      <ToastProvider>
        <TodoApp />
      </ToastProvider>
    </TopbarProvider>,
  )
}

describe('TodoApp', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('can add a new task via input + button', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.click(screen.getByLabelText('Add task'))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('can add a new task via Enter key', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Write tests' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('does not add empty tasks', () => {
    renderWithProviders()
    const addBtn = screen.getByLabelText('Add task')
    expect(addBtn).toBeDisabled()
  })

  it('can toggle a task complete', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Task to complete' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const checkbox = screen.getByLabelText('Mark complete')
    fireEvent.click(checkbox)
    expect(screen.getByLabelText('Mark incomplete')).toBeInTheDocument()
  })

  it('can delete a task', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Delete me' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const deleteBtn = screen.getByLabelText('Delete task')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByText('Delete')
    fireEvent.click(confirmBtn)
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('shows correct item counts in segments', () => {
    renderWithProviders()
    expect(screen.getByText('All (0)')).toBeInTheDocument()
    expect(screen.getByText('Active (0)')).toBeInTheDocument()
    expect(screen.getByText('Done (0)')).toBeInTheDocument()
  })

  it('clears completed tasks', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Task one' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'Task two' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const checkboxes = screen.getAllByLabelText('Mark complete')
    fireEvent.click(checkboxes[0])

    const clearBtn = screen.getByText(/Clear.*completed/)
    fireEvent.click(clearBtn)
    expect(screen.queryByText('Task one')).not.toBeInTheDocument()
    expect(screen.getByText('Task two')).toBeInTheDocument()
  })

  it('can add a subtask', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Parent task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const subtaskBtn = screen.getByLabelText('Add subtask')
    fireEvent.click(subtaskBtn)

    const subtaskInput = screen.getByPlaceholderText('Add a subtask...')
    fireEvent.change(subtaskInput, { target: { value: 'Child task' } })
    fireEvent.keyDown(subtaskInput, { key: 'Enter' })

    expect(screen.getByText('Child task')).toBeInTheDocument()
  })

  it('cycles priority on click', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Priority task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const priorityBtn = screen.getByLabelText('Priority: medium. Click to change.')
    fireEvent.click(priorityBtn)
    expect(screen.getByLabelText('Priority: high. Click to change.')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Priority: high. Click to change.'))
    expect(screen.getByLabelText('Priority: low. Click to change.')).toBeInTheDocument()
  })

  it('can cancel deletion', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Keep me' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const deleteBtn = screen.getByLabelText('Delete task')
    fireEvent.click(deleteBtn)

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })

  it('does not render clear button when no tasks completed', () => {
    renderWithProviders()
    expect(screen.queryByText(/Clear.*completed/)).not.toBeInTheDocument()
  })

  it('renders active count badge in header', () => {
    renderWithProviders()
    expect(screen.getByText('0 active')).toBeInTheDocument()
  })

  it('shows default tag manager state when task exists', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Tagged task' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Tagged task')).toBeInTheDocument()
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('gf:todo:list', JSON.stringify({ items: 'not-an-array', tags: null }))
    renderWithProviders()
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('filters by completed segment', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Active task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const doneSegment = screen.getByText(/^Done/)
    fireEvent.click(doneSegment)
    expect(screen.queryByText('Active task')).not.toBeInTheDocument()
    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument()

    const allSegment = screen.getByText(/^All/)
    fireEvent.click(allSegment)
    expect(screen.getByText('Active task')).toBeInTheDocument()
  })

  it('shows empty state when all tasks are completed', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Task' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const checkbox = screen.getByLabelText('Mark complete')
    fireEvent.click(checkbox)

    const activeSegment = screen.getByText(/^Active/)
    fireEvent.click(activeSegment)
    expect(screen.getByText('All tasks are done!')).toBeInTheDocument()
  })
})
