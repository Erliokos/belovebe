import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { discoverAPI } from '../api/client';
import MapModal from '../components/MapModal';
import IconMap from '../assets/map.svg?react'
import { UserCard } from '../components/UserCard';
import { usersMok } from '../stores/mok';
// import { UserCardBacking } from '../components/UserCardBacking';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const Header = styled.div`
  padding: 16px;
  height: var(--header-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background-color: var(--main-color);
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  flex: 1;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--tg-theme-button-color, #3390ec);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  &:active {
    opacity: 0.8;
  }
`
const UserList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`;

const ErrorText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #ff4444;
`;

const FilterIcon = styled.svg`
  width: 25px;
  height: 25px;
  fill: var(--tg-theme-button-text-color, #ffffff);
`

export default function discoverPage() {
  const { t } = useTranslation();

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  // const [swipeProgress, setSwipeProgress] = useState(0)

  const [shift, setShift] = useState(0)
  // const [nextShift, setNextShift] = useState(1)

  const handleLike = useCallback(() => {
    setShift(prev => prev + 1)
  }, [])

  // useEffect(() => {
  //   setTimeout(() => {
  //     setNextShift(shift + 1)
  //   }, 100)
  // },[shift])
  

  const [ageMin, ageMax, maxDistance, limit, skip] = [
    undefined,
    undefined,
    undefined,
    10,
    undefined
  ]

  const { isLoading, error } = useQuery({
    queryKey: ['discover', ageMin, ageMax, maxDistance, limit, skip],
    queryFn: () =>
      discoverAPI.getDiscover({
        ageMin,
        ageMax,
        maxDistance,
        limit,
        skip
      }),
  })


  if (isLoading) {
    return (
      <Container>
        <LoadingText>{t('discover.loading')}</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorText>{t('discover.error')}</ErrorText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>{t('discover.title')}</Title>
        <Button onClick={() => setIsMapModalOpen(true)}>
          <FilterIcon as={IconMap} />
        </Button>
        {/* <Button onClick={() => setFiltersModalOpen(true)}>
          <FilterIcon as={IconFilter} />
        </Button> */}
      </Header>

      <UserList>


        {usersMok[shift] && (
          <UserCard
            key={usersMok[shift].id + 'first'}
            onLike={handleLike}
            onDislike={handleLike}
            user={usersMok[shift]}
            // swipeProgressCallback={setSwipeProgress} // новый проп
          />
        )}
      </UserList>

      {/* {isFiltersModalOpen && <CategoriesFiltersModal />} */}
      {isMapModalOpen && <MapModal onClose={() => setIsMapModalOpen(false)} />}
    </Container>
  )
}
