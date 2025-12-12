import React, { useRef, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'

const Container = styled.div<{ $blur: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;
  padding: 16px;
  z-index: 200;
  filter: blur(${({ $blur: blur }) => blur}px);
  transition: filter 0.1s ease-out; // Плавный переход для blur
  backface-visibility: hidden;
  transform: translateZ(0);
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
  const [blurAmount, setBlurAmount] = useState(0)
  const startX = useRef(0)
  const currentX = useRef(0)
  const animationFrameRef = useRef<number>()
  const threshold = window.innerWidth * 0.5

  const updateTransform = useCallback(
    (x: number) => {
      if (!cardRef.current) return

      // Отменяем предыдущий фрейм, если он есть
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Используем requestAnimationFrame для плавности
      animationFrameRef.current = requestAnimationFrame(() => {
        if (cardRef.current) {
          const rotation = x / 25
          cardRef.current.style.transform = `translateX(${x}px) rotate(${rotation}deg)`
        }
      })

      // Обновляем blur в зависимости от смещения
      const progress = Math.min(Math.abs(x) / threshold, 1)
      const blur = progress * 8 // Максимальный blur 8px, можно регулировать
      setBlurAmount(blur)

      if (onDragProgress) {
        onDragProgress(progress * 20)
      }
    },
    [onDragProgress, threshold]
  )

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // e.preventDefault()
    setDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    startX.current = clientX
    currentX.current = 0

    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
    }
    setBlurAmount(0) // Сбрасываем blur при начале касания
  }, [])

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return
      // e.preventDefault()

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      currentX.current = clientX - startX.current

      updateTransform(currentX.current)
    },
    [isDragging, updateTransform]
  )

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setDragging(false)

    // Очищаем анимационный фрейм
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const delta = currentX.current

    if (delta < -threshold) {
      // Свайп влево (дизлайк)
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease-out'
        cardRef.current.style.transform = `translateX(-${window.innerWidth * 1.2}px) rotate(-30deg)`
        cardRef.current.style.filter = `blur(20px)`
        onDragProgress?.(20)
      }
      // Плавно убираем blur при свайпе
      setBlurAmount(0)
      setTimeout(() => leftAction?.(), 300)
    } else if (delta > threshold) {
      // Свайп вправо (лайк)
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease-out'
        cardRef.current.style.transform = `translateX(${window.innerWidth * 1.2}px) rotate(30deg)`
        cardRef.current.style.filter = `blur(20px)`
      }
      setBlurAmount(0)
      setTimeout(() => rightAction?.(), 300)
    } else {
      // Возврат в исходное положение
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.25s ease-out'
        cardRef.current.style.transform = 'translateX(0) rotate(0)'
      }
      // Плавно возвращаем blur к 0
      setBlurAmount(0)
    }

    if (onDragProgress) {
      onDragProgress(0)
    }
  }, [isDragging, threshold, leftAction, rightAction, onDragProgress])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <Container
      $blur={blurAmount}
      key={id}
      ref={cardRef}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {children}
    </Container>
  )
}
