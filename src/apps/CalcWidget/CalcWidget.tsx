import { useState, useCallback } from 'react'
import './CalcWidget.css'

function compute(a: number, b: number, operator: string): number {
  switch (operator) {
    case '+': return a + b
    case '-': return a - b
    case '×': return a * b
    case '÷': return b !== 0 ? a / b : 0
    default: return b
  }
}

export default function CalcWidget() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [resetNext, setResetNext] = useState(false)

  const inputDigit = useCallback((d: string) => {
    if (resetNext) {
      setDisplay(d)
      setResetNext(false)
    } else {
      setDisplay(display === '0' ? d : display + d)
    }
  }, [display, resetNext])

  const inputDecimal = useCallback(() => {
    if (resetNext) {
      setDisplay('0.')
      setResetNext(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }, [display, resetNext])

  const handleOp = useCallback((nextOp: string) => {
    const cur = parseFloat(display)
    if (prev !== null && op && !resetNext) {
      const result = compute(prev, cur, op)
      setDisplay(String(result))
      setPrev(result)
    } else {
      setPrev(cur)
    }
    setOp(nextOp)
    setResetNext(true)
  }, [display, prev, op, resetNext])

  const equals = useCallback(() => {
    if (prev === null || !op) return
    const cur = parseFloat(display)
    const result = compute(prev, cur, op)
    setDisplay(String(result))
    setPrev(null)
    setOp(null)
    setResetNext(true)
  }, [display, prev, op])

  const clear = useCallback(() => {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setResetNext(false)
  }, [])

  return (
    <div className="gf-widget-calc">
      <div className="gf-widget-calc__display">{display}</div>
      <div className="gf-widget-calc__grid">
        <button className="gf-widget-calc__btn gf-widget-calc__btn--op" onClick={clear}>C</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--op" onClick={() => handleOp('÷')}>÷</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--op" onClick={() => handleOp('×')}>×</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--op" onClick={() => handleOp('-')}>−</button>

        <button className="gf-widget-calc__btn" onClick={() => inputDigit('7')}>7</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('8')}>8</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('9')}>9</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--op" onClick={() => handleOp('+')}>+</button>

        <button className="gf-widget-calc__btn" onClick={() => inputDigit('4')}>4</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('5')}>5</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('6')}>6</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--eq" onClick={equals}>=</button>

        <button className="gf-widget-calc__btn" onClick={() => inputDigit('1')}>1</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('2')}>2</button>
        <button className="gf-widget-calc__btn" onClick={() => inputDigit('3')}>3</button>
        <button className="gf-widget-calc__btn gf-widget-calc__btn--wide" onClick={() => inputDigit('0')}>0</button>
        <button className="gf-widget-calc__btn" onClick={inputDecimal}>.</button>
      </div>
    </div>
  )
}
