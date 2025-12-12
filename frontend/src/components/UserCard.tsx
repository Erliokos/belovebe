import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SwipeCard } from './SwiperCard'

const CardContainer = styled.div<{ visible: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  transform: scale(${props => (props.visible ? 1 : 0.1)});
  transition: 0.5s ease;
  filter: blur(${props => (props.visible ? 0 : 5)}px);
  z-index: 220;
`

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 220;
`

const Info = styled.div<{ visible: boolean }>`
  position: absolute;
  width: 100%;
  padding: 20px;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
  z-index: 230;
  bottom: ${props => (props.visible ? 0 : -200)}px;
  transition: 2s cubic-bezier(1, 0, 0, 1);
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Name = styled.div`
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
`

const Details = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-top: 2px;
`

const Bio = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-top: 6px;
`

const PhotoPreviewContainer = styled.div`
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 6px;
`

const PhotoPreview = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #fff;
`

export interface DiscoverPhoto {
  id: string
  url: string
  isProfilePhoto: boolean
}

export interface DiscoverUser {
  id: string
  displayName?: string
  birthdate?: string
  gender?: string
  genderPreferences: string[]
  bio?: string
  city?: string
  country?: string
  lat?: number
  lng?: number
  photos: DiscoverPhoto[]
}

interface UserCardProps {
  user: DiscoverUser
  onLike?: () => void
  onDislike?: () => void
  swipeProgressCallback?: (progress: number) => void
}

export function UserCard({
  user,
  onLike,
  onDislike,
  swipeProgressCallback
}: UserCardProps) {
  const mainPhoto = user.photos.find(p => p.isProfilePhoto) || user.photos[0]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const age = user.birthdate
    ? new Date().getFullYear() - new Date(user.birthdate).getFullYear()
    : undefined

  return (
    <SwipeCard
      id={user.id}
      leftAction={onDislike}
      rightAction={onLike}
      onDragProgress={swipeProgressCallback}
    >
      <CardContainer visible={visible}>
        <Info visible={visible}>
          <PhotoPreviewContainer>
            {user.photos
              .filter(p => !p.isProfilePhoto)
              .slice(0, 3)
              .map(p => (
                <PhotoPreview key={p.id} src={p.url} />
              ))}
          </PhotoPreviewContainer>
          <Name>
            {user.displayName} {age ? `, ${age}` : ''}
          </Name>
          <Details>
            {user.city && user.country ? `${user.city}, ${user.country}` : ''}
            {user.gender ? ` • ${user.gender}` : ''}
            {user.genderPreferences.length
              ? ` • Interested in ${user.genderPreferences.join(', ')}`
              : ''}
            {user.bio && <Bio>{user.bio}</Bio>}
          </Details>
        </Info>
        {mainPhoto && <Photo src={mainPhoto.url} alt={user.displayName} />}
        {/* Мини-превью других фото */}
      </CardContainer>
    </SwipeCard>
  )
}
