import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GfSlider } from './Slider'

describe('GfSlider', () => {
  it('renders with default value', () => {
    render(<GfSlider value={0.5} />)
    const input = screen.getByRole('slider')
    // range input type='range' has implicit slider role
    expect(input).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const onChange = vi.fn()
    render(<GfSlider value={0.5} onChange={onChange} />)
    const input = screen.getByRole('slider') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0.75' } })
    expect(onChange).toHaveBeenCalledWith(0.75)
  })

  it('renders with correct min/max/step', () => {
    render(<GfSlider min={0} max={100} step={1} value={50} />)
    const input = screen.getByRole('slider')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveAttribute('step', '1')
  })
})
