import React, { createContext, useContext, useState } from 'react'

export type Side = 'left' | 'right' | null

interface SwipeManagerState {
  openCardId: string | null
  openSide: Side
  setOpen: (id: string | null, side: Side) => void
}

const SwipeManagerContext = createContext<SwipeManagerState | null>(null)

export const SwipeManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [openSide, setOpenSide] = useState<Side>(null)

  const setOpen = (id: string | null, side: Side) => {
    if (side === null) {
      setOpenCardId(null)
      setOpenSide(null)
    } else {
      setOpenCardId(id)
      setOpenSide(side)
    }
  }

  return (
    <SwipeManagerContext.Provider value={{ openCardId, openSide, setOpen }}>
      {children}
    </SwipeManagerContext.Provider>
  )
}

export const useSwipeManager = () => {
  const ctx = useContext(SwipeManagerContext)
  if (!ctx) throw new Error('useSwipeManager must be used inside Provider')
  return ctx
}
