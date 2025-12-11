import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAppStore } from '../stores/appStore'
import { categoriesAPI, filtersAPI, locationsAPI } from '../api/client'
import { Category, Country, City, UserFilters } from '../types'
import CloseIcon from '../assets/close.svg?react'
import ApplyIcon from '../assets/apply.svg?react'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
`

const Modal = styled.div`
  background-color: var(--tg-theme-bg-color, #ffffff);
  width: 100%;
  border-radius: 20px 20px 0 0;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 3000;
  position: relative;
`

const ModalHeader = styled.div`
  background-color: var(--tg-theme-secondary-bg-color, #ffffff);
  position: fixed;
  padding: 24px;
  border-radius: 20px 20px 0 0;
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const ModalBody = styled.div`
  padding: 24px;
  padding-top: 98px;
  margin-top: -10px;
`

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`

const SvgButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`

const Section = styled.div`
  margin-bottom: 24px;
`

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`

const List = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const Item = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props =>
    props.$selected
      ? 'var(--tg-theme-button-color, #2481cc)'
      : 'var(--tg-theme-secondary-bg-color, #f0f0f0)'};
  color: ${props =>
    props.$selected
      ? 'var(--tg-theme-button-text-color, #ffffff)'
      : 'var(--tg-theme-text-color, #000000)'};
  cursor: pointer;
  border: 2px solid
    ${props =>
      props.$selected
        ? 'var(--tg-theme-button-color, #2481cc)'
        : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props =>
      !props.$selected
        ? 'var(--tg-theme-hint-color, #999999)'
        : 'var(--tg-theme-button-color, #2481cc)'};
  }
`

const ItemName = styled.span`
  font-size: 12px;
  text-align: center;
`

const ButtonGrup = styled.div`
  display: flex;
  gap: 16px;
`
const Icon = styled.svg<{ $isActive?: boolean }>`
  width: 25px;
  height: 25px;
  fill: ${({ $isActive }) =>
    $isActive
      ? 'var(--tg-theme-button-color, #3390ec)'
      : 'var(--tg-theme-subtitle-text-color, #999999)'};
`

export default function CategoriesFiltersModal() {
  const { t } = useTranslation()
  const { isFiltersModalOpen, setFiltersModalOpen, filters, setFilters } =
    useAppStore()
  const queryClient = useQueryClient()

  const [localFilters, setLocalFilters] = useState<UserFilters>(filters)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('')

  const isDirty = useMemo(() => {
    return JSON.stringify(localFilters) !== JSON.stringify(filters)
  }, [localFilters, filters])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getCategories,
    enabled: isFiltersModalOpen
  })

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: locationsAPI.getCountries,
    enabled: isFiltersModalOpen
  })

  const { data: cities } = useQuery({
    queryKey: ['cities', selectedCountryCode],
    queryFn: () => locationsAPI.getCities(selectedCountryCode),
    enabled: isFiltersModalOpen && !!selectedCountryCode
  })



  const saveFiltersMutation = useMutation({
    mutationFn: filtersAPI.saveFilters,
    onSuccess: data => {
      setFilters(data)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // setFiltersModalOpen(false); // раскомментируйте если нужно закрывать модалку после применения
    }
  })

  useEffect(() => {
    if (isFiltersModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isFiltersModalOpen])
  

  // Сбрасываем локальные фильтры при открытии модалки
  useEffect(() => {
    if (isFiltersModalOpen) {
      setLocalFilters(filters)
    }
  }, [filters, isFiltersModalOpen])

  const handleToggleCategory = useCallback((categoryId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }))
  }, [])

  const handleToggleCountry = useCallback((countryCode: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedCountries: prev.selectedCountries.includes(countryCode)
      ? prev.selectedCountries.filter(code => code !== countryCode)
      : [...prev.selectedCountries, countryCode],
      // Если убрали страну - убираем и её города из выбранных
      selectedCities: []
    }))
    setSelectedCountryCode(countryCode)
  }, [])

  const handleToggleCity = useCallback((cityName: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(cityName)
        ? prev.selectedCities.filter(name => name !== cityName)
        : [...prev.selectedCities, cityName]
    }))
  }, [])

  const handleWorldwideToggle = useCallback(() => {
    setLocalFilters(prev => ({
      ...prev,
      worldwideMode: !prev.worldwideMode,
      // При включении worldwideMode очищаем выбранные страны и города
      ...(prev.worldwideMode
        ? {}
        : {
            selectedCountries: [],
            selectedCities: []
          })
    }))
  }, [])

  const handledApply = useCallback(() => {
    saveFiltersMutation.mutate(localFilters)
  }, [localFilters, saveFiltersMutation])

  const handleClose = useCallback(() => {
    setFiltersModalOpen(false)
  }, [setFiltersModalOpen])

  // Опционально: добавляем кнопку Apply
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handledApply()
    },
    [handledApply]
  )

  if (!isFiltersModalOpen) return null

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>{t('filters.title')}</ModalTitle>
            <ButtonGrup>
              {isDirty && (
                <SvgButton disabled={!isDirty}>
                  <Icon as={ApplyIcon} $isActive={isDirty} />
                </SvgButton>
              )}
              <SvgButton onClick={handleClose}>
                <Icon as={CloseIcon} />
              </SvgButton>
            </ButtonGrup>
          </ModalHeader>

          <ModalBody>
            <Section>
              <SectionTitle>{t('filters.categories')}</SectionTitle>
              <List>
                {categories?.map((category: Category) => (
                  <Item
                    key={category.id}
                    onClick={() => handleToggleCategory(category.id)}
                    $selected={localFilters.selectedCategories.includes(
                      category.id
                    )}
                  >
                    <ItemName>{t(`categories.${category.name}`)}</ItemName>
                  </Item>
                ))}
              </List>
            </Section>

            <Section>
              <Item
                onClick={handleWorldwideToggle}
                $selected={localFilters.worldwideMode}
                as="button"
                type="button"
              >
                <ItemName>{t('filters.worldwide')}</ItemName>
              </Item>
            </Section>

            {!localFilters.worldwideMode && (
              <>
                <Section>
                  <SectionTitle>{t('filters.countries')}</SectionTitle>
                  <List>
                    {countries?.map((country: Country) => (
                      <Item
                        key={country.code}
                        onClick={() => handleToggleCountry(country.code)}
                        $selected={localFilters.selectedCountries.includes(
                          country.code
                        )}
                      >
                        <ItemName>{country.name}</ItemName>
                      </Item>
                    ))}
                  </List>
                </Section>

                {selectedCountryCode && cities && (
                  <Section>
                    <SectionTitle>{t('filters.cities')}</SectionTitle>
                    <List>
                      {cities.map((city: City) => (
                        <Item
                          key={city.name}
                          onClick={() => handleToggleCity(city.name)}
                          $selected={localFilters.selectedCities.includes(
                            city.name
                          )}
                        >
                          <ItemName>{city.name}</ItemName>
                        </Item>
                      ))}
                    </List>
                  </Section>
                )}
              </>
            )}
          </ModalBody>
        </form>
      </Modal>
    </Overlay>
  )
}
