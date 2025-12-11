import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSwipeManager } from '../stores/SwipeManagerContext'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 8px;
`

const SideButtons = styled.div<{ $isOpen: boolean; side: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  transition: width 0.3s ease;
  overflow: hidden;
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0;')}
  width: ${({ $isOpen }) => ($isOpen ? '140px' : '0px')};
`

const Card = styled.div<{ $offsetX: number }>`
  transform: translateX(${({ $offsetX }) => $offsetX}px);
  transition: transform 0.2s ease;
  user-select: none;
  width: 100%;
  cursor: grab;
`

interface SwipeCardProps {
  id: string
  children: React.ReactNode
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  id,
  children,
  leftAction,
  rightAction
}) => {
  const { openCardId, openSide, setOpen } = useSwipeManager()

  const isOpen = openCardId === id
  const startX = useRef(0)
  const currentX = useRef(0)
  const directionLocked = useRef<null | 'left' | 'right'>(null)
  const swipeHandled = useRef(false)
  const active = useRef(false)

  const [offsetX, setOffsetX] = useState(0)
  const max = 140

  /** Получаем X координату из Touch или Mouse события */
  const getClientX = (e: any) => {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX
    return e.clientX
  }

  /** Синхронизируем состояние открытой карточки */
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0)
    } else if (openSide === 'left') {
      setOffsetX(max)
    } else if (openSide === 'right') {
      setOffsetX(-max)
    }
  }, [isOpen, openSide])

  /** START — начало свайпа */
  const handleStart = (e: any) => {
    active.current = true
    const x = getClientX(e)
    startX.current = x
    currentX.current = x
    directionLocked.current = null
    swipeHandled.current = false
  }

  /** MOVE — двигаем */
  const handleMove = (e: any) => {
    if (!active.current) return

    // для мыши: если кнопка не зажата — не обрабатываем
    if ('buttons' in e && e.buttons === 0) return

    const x = getClientX(e)
    const diff = x - startX.current
    currentX.current = x

    if (swipeHandled.current) return

    // определяем направление
    if (!directionLocked.current) {
      if (Math.abs(diff) < 50) return

      directionLocked.current = diff > 0 ? 'right' : 'left'

      // закрываем при свайпе в сторону закрытия
      if (isOpen) {
        if (
          (openSide === 'left' && directionLocked.current === 'left') ||
          (openSide === 'right' && directionLocked.current === 'right')
        ) {
          setOpen(null, null)
          swipeHandled.current = true
          return
        }
      }

      // открываем
      if (directionLocked.current === 'right' && leftAction && !isOpen) {
        setOpen(id, 'left')
        swipeHandled.current = true
      } else if (directionLocked.current === 'left' && rightAction && !isOpen) {
        setOpen(id, 'right')
        swipeHandled.current = true
      }

      return
    }
  }

  /** END — отпускаем палец/мышь */
  const handleEnd = () => {
    if (active.current) {
      if (
        isOpen &&
        !swipeHandled.current &&
        Math.abs(currentX.current - startX.current) < 30
      ) {
        setOpen(null, null)
      }
    }

    active.current = false
    directionLocked.current = null
    swipeHandled.current = false
  }

  /** Клик по карточке закрывает её */
  const handleCardClick = () => {
    if (isOpen) {
      setOpen(null, null)
    }
  }

  return (
    <Wrapper>
      {leftAction && (
        <SideButtons side="left" $isOpen={isOpen && openSide === 'left'}>
          {leftAction}
        </SideButtons>
      )}

      {rightAction && (
        <SideButtons side="right" $isOpen={isOpen && openSide === 'right'}>
          {rightAction}
        </SideButtons>
      )}

      <Card
        $offsetX={offsetX}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onClick={handleCardClick}
      >
        {children}
      </Card>
    </Wrapper>
  )
}
