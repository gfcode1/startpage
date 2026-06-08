import { render, screen } from '@testing-library/react'
import { TopbarProvider } from '../../framework/TopbarContext'
import SnakeApp from './SnakeApp'

function renderWithProviders() {
  return render(
    <TopbarProvider>
      <SnakeApp />
    </TopbarProvider>,
  )
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      canvas: this,
      clearRect: () => {},
      fillRect: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      beginPath: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      arc: () => {},
      rect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arcTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
      setTransform: () => {},
      save: () => {},
      restore: () => {},
      font: '',
      textAlign: 'left' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
    } as unknown as CanvasRenderingContext2D
  }
})

describe('SnakeApp', () => {
  it('renders the app without crashing', () => {
    renderWithProviders()
    expect(screen.getByText('Snake')).toBeInTheDocument()
  })

  it('shows score and best score boxes', () => {
    renderWithProviders()
    expect(screen.getByText('SCORE')).toBeInTheDocument()
    expect(screen.getByText('BEST')).toBeInTheDocument()
  })
})
