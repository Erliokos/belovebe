import styled from 'styled-components'
import { DiscoverUser } from '../types'

const BackingContainer = styled.div<{ $progress: number }>`
  padding: 16px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  overflow: hidden;
  pointer-events: none; // чтобы не мешать свайпу основной карточки
  filter: blur(${({ $progress: progress }) => 20 - progress}px);
  transform: scale(${({ $progress: progress }) => 0.8 + 0.05 * (progress / 20) * 4});
  transition: opacity 0.1s, transform 0.1s;
`

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
`

export interface UserCardBackingProps {
  user: DiscoverUser
  swipeProgress?: number // от 0 до 1
}

export function UserCardBacking({
  user,
  swipeProgress = 0
}: UserCardBackingProps) {

  
  const mainPhoto = user.photos.find(p => p.isProfilePhoto) || user.photos[0]
  if (!mainPhoto) return null

  
  return (
    <BackingContainer $progress={swipeProgress === 0 ? 20 : swipeProgress}>
      <Photo src={mainPhoto.url} alt={user.displayName} />
    </BackingContainer>
  )
}
