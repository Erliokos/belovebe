import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { discoverAPI } from '../api/client';
// import CategoriesFiltersModal from '../components/CategoriesFiltersModal';
import MapModal from '../components/MapModal';
import { DiscoverUser } from '../types';
// import IconFilter from '../assets/filter.svg?react'
import IconMap from '../assets/map.svg?react'
import { SwipeManagerProvider } from '../stores/SwipeManagerContext';

const Container = styled.div`
  padding: 16px;
  max-width: 100%;
`;

const Header = styled.div`
  padding: 0 8px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

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
const TasksList = styled.div`
  display: flex;
  flex-direction: column;
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



export default function FeedPage() {
  const { t } = useTranslation();
  // const navigate = useNavigate();
  // const { 
  //   filters, 
  //   setFilters, 
  //   filtersLoaded, 
  //   setFiltersLoaded,
  //   setFiltersModalOpen,
  //   isFiltersModalOpen 
  // } = useAppStore();
  // const [page] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Загружаем фильтры при первой загрузке
  // const { data: userFilters, isLoading: filtersLoading } = useQuery({
  //   queryKey: ['userFilters'],
  //   queryFn: filtersAPI.getFilters,
  //   enabled: !filtersLoaded,
  // });

  // useEffect(() => {
  //   if (userFilters && !filtersLoaded) {
  //     setFilters(userFilters);
  //     setFiltersLoaded(true);
  //   }
  // }, [userFilters, filtersLoaded, setFilters, setFiltersLoaded]);

  // Формируем параметры запроса задач
  // const countriesParam = filters.selectedCountries.length > 0 
  //   ? filters.selectedCountries.join(',') 
  //   : undefined;
  // const citiesParam = filters.selectedCities.length > 0 
  //   ? filters.selectedCities.join(',') 
  //   : undefined;
 
  const [ageMin, ageMax, maxDistance, limit, skip] = [18, 100, 100, 100, 0]

  const { data, isLoading, error } = useQuery({
    queryKey: ['discover', ageMin, ageMax, maxDistance, limit, skip],
    queryFn: () =>
      discoverAPI.getDiscover({
        ageMin,
        ageMax,
        maxDistance,
        limit,
        skip
      }),
    enabled: !!ageMin && !!ageMax,
    refetchInterval: 5000
  })

  // const handleTaskClick = (taskId: number) => {
  //   navigate(`/task/${taskId}`);
  // };

  // if (filtersLoading || !filtersLoaded) {
  //   return (
  //     <Container>
  //       <LoadingText>{t('feed.loading')}</LoadingText>
  //     </Container>
  //   );
  // }

  if (isLoading) {
    return (
      <Container>
        <LoadingText>{t('feed.loading')}</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorText>{t('feed.error')}</ErrorText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>{t('feed.title')}</Title>
        <Button onClick={() => setIsMapModalOpen(true)}>
          <FilterIcon as={IconMap} />
        </Button>
        {/* <Button onClick={() => setFiltersModalOpen(true)}>
          <FilterIcon as={IconFilter} />
        </Button> */}
      </Header>
      <SwipeManagerProvider>
        <TasksList>
          {data?.users?.map((user: DiscoverUser) => {
            return <div>{user.displayName}</div>
          })}
          {data?.users?.length === 0 && (
            <LoadingText>{t('feed.noTasks')}</LoadingText>
          )}
        </TasksList>
      </SwipeManagerProvider>
      {/* {isFiltersModalOpen && <CategoriesFiltersModal />} */}
      {isMapModalOpen && <MapModal onClose={() => setIsMapModalOpen(false)} />}
    </Container>
  )
}
