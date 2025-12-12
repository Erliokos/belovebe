import { useRef, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  touch-action: none;
  will-change: auto;
  padding: 16px;
  z-index: 200;
`

interface SwipeCardProps {
  id: string
  children: React.ReactNode
  leftAction?: () => void
  rightAction?: () => void
  onDragProgress?: (progress: number) => void
}

export function SwipeCard({
  id,
  children,
  leftAction,
  rightAction,
  onDragProgress
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const threshold = window.innerWidth

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setDragging(true)
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    currentX.current = x - startX.current

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${
        currentX.current
      }px) rotate(${currentX.current / 20}deg)`
    }

    if (onDragProgress) {
      const progress = Math.min(Math.abs(currentX.current) / threshold, 1)
      onDragProgress(progress)
    }
  }

  const handleEnd = () => {
    setDragging(false)
    const delta = currentX.current

    if (delta < -window.innerWidth / 2) {
      cardRef.current!.style.transition = '0.3s'
      cardRef.current!.style.transform = 'translateX(-120%) rotate(-20deg)'
      leftAction?.()
    } else if (delta > window.innerWidth / 2) {
      cardRef.current!.style.transition = '0.3s'
      cardRef.current!.style.transform = 'translateX(120%) rotate(20deg)'
      rightAction?.()
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = '0.25s'
        cardRef.current.style.transform = 'translateX(0) rotate(0)'
      }
    }

    if (onDragProgress) {
      onDragProgress(0)
    }
  }

  return (
    <Container
      key={id}
      ref={cardRef}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={isDragging ? handleEnd : undefined}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {children}
    </Container>
  )
}

