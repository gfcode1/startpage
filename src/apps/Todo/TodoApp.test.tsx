import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider } from '../../framework/ToastContext'
import TodoApp from './TodoApp'

function renderWithProviders() {
  return render(
    <ToastProvider>
      <TodoApp />
    </ToastProvider>,
  )
}

describe('TodoApp', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the app title', () => {
    renderWithProviders()
    expect(screen.getByText('My Todo List')).toBeInTheDocument()
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
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('filters tasks by search', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'Beta' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
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
    fireEvent.click(checkboxes[1])

    const clearBtn = screen.getByText(/Clear.*completed/)
    fireEvent.click(clearBtn)
    expect(screen.queryByText('Task one')).not.toBeInTheDocument()
    expect(screen.getByText('Task two')).toBeInTheDocument()
  })
})
