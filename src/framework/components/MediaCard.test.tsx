import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MediaCard } from './MediaCard'

describe('MediaCard', () => {
  const baseProps = {
    id: 'test-1',
    title: 'Test Stream',
    description: 'A test description',
  }

  it('renders title and description', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByText('Test Stream')).toBeInTheDocument()
    expect(screen.getByText('A test description')).toBeInTheDocument()
  })

  it('renders image when provided', () => {
    render(<MediaCard {...baseProps} image="https://example.com/img.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Test Stream')
  })

  it('shows fallback initial when image errors', () => {
    render(<MediaCard {...baseProps} image="https://example.com/bad.jpg" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows play button', () => {
    render(<MediaCard {...baseProps} onPlay={() => {}} />)
    expect(screen.getByLabelText('Play')).toBeInTheDocument()
  })

  it('calls onPlay when play clicked', () => {
    const onPlay = vi.fn()
    render(<MediaCard {...baseProps} onPlay={onPlay} />)
    fireEvent.click(screen.getByLabelText('Play'))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('shows stop label when playing', () => {
    render(<MediaCard {...baseProps} isPlaying onPlay={() => {}} />)
    expect(screen.getByLabelText('Stop')).toBeInTheDocument()
  })

  it('shows spinner when loading', () => {
    render(<MediaCard {...baseProps} isLoading isPlaying onPlay={() => {}} />)
    expect(screen.getByLabelText('Stop')).toBeInTheDocument()
  })

  it('shows favorite button', () => {
    render(<MediaCard {...baseProps} onFavorite={() => {}} />)
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
  })

  it('shows remove from favorites when favorited', () => {
    render(<MediaCard {...baseProps} isFavorite onFavorite={() => {}} />)
    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
  })

  it('calls onFavorite when favorite clicked', () => {
    const onFavorite = vi.fn()
    render(<MediaCard {...baseProps} onFavorite={onFavorite} />)
    fireEvent.click(screen.getByLabelText('Add to favorites'))
    expect(onFavorite).toHaveBeenCalledWith('test-1')
  })

  it('renders metadata', () => {
    render(<MediaCard {...baseProps} metadata={<span>meta</span>} />)
    expect(screen.getByText('meta')).toBeInTheDocument()
  })

  it('renders now playing info', () => {
    render(<MediaCard {...baseProps} nowPlaying="Current track" />)
    expect(screen.getByText('now playing')).toBeInTheDocument()
    expect(screen.getByText('Current track')).toBeInTheDocument()
  })

  it('renders before title content via renderBeforeTitle', () => {
    render(<MediaCard {...baseProps} renderBeforeTitle={() => <span>badge</span>} />)
    expect(screen.getByText('badge')).toBeInTheDocument()
  })
})
