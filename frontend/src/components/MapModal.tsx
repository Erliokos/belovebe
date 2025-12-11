import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import styled from 'styled-components';
import { tasksAPI, profileAPI, locationsAPI } from '../api/client';
import { Task } from '../types';
import { useAppStore } from '../stores/appStore';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background-color: var(--tg-theme-secondary-bg-color, #ffffff);
  border-radius: 20px;
  padding: 16px;
  overflow: hidden;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  z-index: 3000;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--tg-theme-text-color, #000000);
`;

const MapWrapper = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  
  .leaflet-container {
    height: 100%;
    width: 100%;
  }
`;

// Создаем иконку для маркера
const createMarkerIcon = () => {
  return new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

type MapModalProps = {
  onClose: () => void;
};

export default function MapModal({ onClose }: MapModalProps) {
  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>([55.7558, 37.6173]); // Москва по умолчанию
  const [zoom, setZoom] = useState(10);
  const { filters, filtersLoaded } = useAppStore();
  const navigate = useNavigate();

  // Получаем профиль пользователя для определения начальной точки
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile,
  });

  const categoriesParam = filters.selectedCategories.length > 0
    ? filters.selectedCategories.join(',')
    : undefined;
  const countriesParam = filters.selectedCountries.length > 0
    ? filters.selectedCountries.join(',')
    : undefined;
  const citiesParam = filters.selectedCities.length > 0
    ? filters.selectedCities.join(',')
    : undefined;
  const worldwideParam = filters.worldwideMode ? 'true' : undefined;

  // Получаем все задачи с координатами по активным фильтрам
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'map', categoriesParam, countriesParam, citiesParam, worldwideParam],
    queryFn: () =>
      tasksAPI.getTasks({
        limit: 1000,
        categories: categoriesParam,
        countries: countriesParam,
        cities: citiesParam,
        worldwide: worldwideParam,
      }),
    enabled: filtersLoaded,
  });

  // Получаем города для приоритетной страны пользователя
  const { data: cities } = useQuery({
    queryKey: ['cities', profile?.profile?.preferredCountry],
    queryFn: () => locationsAPI.getCities(profile!.profile!.preferredCountry!),
    enabled: !!profile?.profile?.preferredCountry,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    // Если у пользователя есть приоритетный город, используем его координаты
    if (profile?.profile?.preferredCity && cities) {
      const city = cities.find(c => c.name === profile.profile?.preferredCity);
      if (city) {
        setCenter([city.lat, city.lng]);
        setZoom(12);
      }
    }
  }, [profile, cities]);

  const tasksWithLocation = tasksData?.tasks?.filter(
    (task: Task) => task.latitude && task.longitude
  ) || [];

  const markerIcon = createMarkerIcon();

  useEffect(() => {
    const elements = document.getElementsByClassName(
      'leaflet-control leaflet-control-attribution'
    )
    if (elements.length > 0) {
      elements[0].remove() // Удаляем первый элемент
    }
  }, [])

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t('map.title')}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <MapWrapper>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!tasksLoading &&
              tasksWithLocation.map((task: Task) => (
                <Marker
                  key={task.id}
                  position={[task.latitude!, task.longitude!]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div
                      onClick={() =>
                        navigate(`/task/${task.id}`, { replace: true })
                      }
                    >
                      <strong>{task.title}</strong>
                      <br />
                      {task.street && (
                        <>
                          {task.street}
                          {task.house && `, ${task.house}`}
                          <br />
                        </>
                      )}
                      {task.city && `${task.city}, `}
                      {task.country}
                      <br />
                      {task.budget && `Бюджет: ${task.budget}`}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </MapWrapper>
      </Modal>
    </Overlay>
  )
}

