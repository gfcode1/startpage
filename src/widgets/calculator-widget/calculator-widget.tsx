import { useState, useCallback } from 'react'
import { SimpleGrid, Button, Text, Paper } from '@mantine/core'

type Op = '+' | '-' | '*' | '/' | null

export default function CalculatorWidget() {
  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [op, setOp] = useState<Op>(null)
  const [waiting, setWaiting] = useState(false)

  const inputDigit = useCallback((digit: string) => {
    if (waiting) {
      setDisplay(digit)
      setWaiting(false)
    } else {
      setDisplay((prev) => (prev === '0' ? digit : prev + digit))
    }
  }, [waiting])

  const inputDecimal = useCallback(() => {
    if (waiting) { setDisplay('0.'); setWaiting(false); return }
    if (!display.includes('.')) setDisplay((prev) => prev + '.')
  }, [display, waiting])

  const clear = useCallback(() => {
    setDisplay('0')
    setPrevValue(null)
    setOp(null)
    setWaiting(false)
  }, [])

  const calculate = useCallback((a: number, operator: Op, b: number): number => {
    switch (operator) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      default: return b
    }
  }, [])

  const handleOp = useCallback((nextOp: Op) => {
    const current = parseFloat(display)
    if (prevValue !== null && op && !waiting) {
      const result = calculate(prevValue, op, current)
      setDisplay(String(result))
      setPrevValue(result)
    } else {
      setPrevValue(current)
    }
    setOp(nextOp)
    setWaiting(true)
  }, [display, prevValue, op, waiting, calculate])

  const equals = useCallback(() => {
    const current = parseFloat(display)
    if (prevValue !== null && op) {
      const result = calculate(prevValue, op, current)
      setDisplay(String(result))
      setPrevValue(null)
      setOp(null)
      setWaiting(true)
    }
  }, [display, prevValue, op, calculate])

  const buttons = [
    'C', '±', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '.', '⌫', '=',
  ]

  const handleButton = (label: string) => {
    if (label === 'C') clear()
    else if (label === '⌫') setDisplay((p) => p.length > 1 ? p.slice(0, -1) : '0')
    else if (label === '±') setDisplay((p) => String(-parseFloat(p)))
    else if (label === '.') inputDecimal()
    else if (label === '=') equals()
    else if (['+', '−', '×', '÷'].includes(label)) {
      const opMap: Record<string, Op> = { '+': '+', '−': '-', '×': '*', '÷': '/' }
      handleOp(opMap[label]!)
    } else inputDigit(label)
  }

  return (
    <div>
      <Paper p="sm" mb="xs" style={{ textAlign: 'right' }}>
        <Text fw={700} style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>{display}</Text>
      </Paper>
      <SimpleGrid cols={4} spacing={4}>
        {buttons.map((label) => (
          <Button
            key={label}
            variant={['C', '±', '%'].includes(label) ? 'light' : ['÷', '×', '−', '+', '='].includes(label) ? 'filled' : 'default'}
            size="compact-sm"
            onClick={() => handleButton(label)}
            style={{ height: 32, padding: 0, fontSize: '0.8rem' }}
          >
            {label}
          </Button>
        ))}
      </SimpleGrid>
    </div>
  )
}
