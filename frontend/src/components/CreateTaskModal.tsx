import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { categoriesAPI, tasksAPI } from '../api/client'
import { CreateTaskData, Task } from '../types'
import { Select } from '../globalStyle'

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
  background-color: var(--tg-theme-secondary-bg-color, #ffffff);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  height: 90vh;
  overflow-y: auto;
  z-index: 3000;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--tg-theme-text-color, #000000);
`

const Field = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`

const Label = styled.label`
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--tg-theme-text-color, #000000);
`

const Input = styled.input`
  padding: 12px;
  border: 1px solid #dedede;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
`

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid #dedede;
  border-radius: 8px;
  font-size: 16px;
  min-height: 80px;
`

const ApplyButton = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const AddressSection = styled.div`
  margin: 20px 0;
  padding: 16px;
  background-color: var(--tg-theme-bg-color, #f5f5f5);
  border-radius: 12px;
`

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--tg-theme-text-color, #000000);
`

const YandexSuggestContainer = styled.div`
  position: relative;
`

const SuggestList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const SuggestItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: var(--tg-theme-hint-color, #000000);
  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`

const AddressPreview = styled.div`
  padding: 12px;
  background-color: #e8f5e8;
  border-radius: 8px;
  font-size: 14px;
  color: #2d5016;
  margin-top: 8px;
`

const LoadingText = styled.div`
  position: absolute;
  right: 10px;
  top: 12px;
  font-size: 14px;
  color: #666;
`

type CreateTaskModalProps = {
  onClose: VoidFunction
  task?: Task
  onSuccess?: () => void
}

const buildInitialForm = (task?: Task): CreateTaskData => ({
  title: task?.title || '',
  description: task?.description || '',
  categoryId: task?.categoryId || 0,
  budget: task?.budget,
  startDate: task?.startDate ? task.startDate.slice(0, 10) : '',
  endDate: task?.endDate ? task.endDate.slice(0, 10) : '',
  country: task?.country,
  city: task?.city,
  street: task?.street,
  house: task?.house,
  latitude: task?.latitude,
  longitude: task?.longitude
})

export function CreateTaskModal({
  onClose,
  task,
  onSuccess
}: CreateTaskModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditMode = Boolean(task)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getCategories
  })

  const [fullAddress, setFullAddress] = useState<string>('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<number | null>(
    null
  )

  const inputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<CreateTaskData>(() => buildInitialForm(task))

  useEffect(() => {
    const initialForm = buildInitialForm(task)
    setForm(initialForm)

    if (task && (task.country || task.city || task.street || task.house)) {
      const addressParts = []
      if (task.country) addressParts.push(task.country)
      if (task.city) addressParts.push(task.city)
      if (task.street) addressParts.push(task.street)
      if (task.house) addressParts.push(`д. ${task.house}`)
      setFullAddress(addressParts.join(', '))
    }
  }, [task])

  const updateField = (field: keyof CreateTaskData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Поиск адресов через Яндекс Геокодер с дебаунсом
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
      if (!apiKey) {
        console.warn('Yandex Maps API key not found')
        return
      }

      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(
          query
        )}&results=5&lang=ru_RU`
      )

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      if (data.response && data.response.GeoObjectCollection) {
        const suggestions = data.response.GeoObjectCollection.featureMember.map(
          (item: any) => ({
            address: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
            coordinates: item.GeoObject.Point.pos
              .split(' ')
              .map(Number)
              .reverse(),
            details: item.GeoObject.metaDataProperty.GeocoderMetaData.Address
          })
        )

        setSuggestions(suggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  // Обработчик изменения input с дебаунсом
  const handleAddressChange = (value: string) => {
    setFullAddress(value)

    // Очищаем предыдущий таймаут
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Устанавливаем новый таймаут для поиска
    const timeout = setTimeout(() => {
      searchAddress(value)
    }, 300) // Задержка 300мс

    setSearchTimeout(timeout as unknown as number)
  }

  // Обработка выбора адреса из подсказок Яндекс
  const handleAddressSelect = (suggestion: any) => {
    setFullAddress(suggestion.address)
    setShowSuggestions(() => {
      console.log('WORK');
      return false
    })

    // Обновляем координаты
    updateField('latitude', suggestion.coordinates[0])
    updateField('longitude', suggestion.coordinates[1])

    // Парсим компоненты адреса из деталей Яндекс
    const components = suggestion.details.Components

    // Находим компоненты адреса
    const countryComponent = components.find(
      (comp: any) => comp.kind === 'country'
    )
    const provinceComponent = components.find(
      (comp: any) => comp.kind === 'province'
    )
    const areaComponent = components.find((comp: any) => comp.kind === 'area')
    const localityComponent = components.find(
      (comp: any) => comp.kind === 'locality'
    )
    const streetComponent = components.find(
      (comp: any) => comp.kind === 'street'
    )
    const houseComponent = components.find((comp: any) => comp.kind === 'house')

    // Заполняем поля формы на основе данных Яндекс
    if (countryComponent) {
      updateField('country', countryComponent.name)
    }

    if (localityComponent) {
      updateField('city', localityComponent.name)
    } else if (areaComponent) {
      updateField('city', areaComponent.name)
    } else if (provinceComponent) {
      updateField('city', provinceComponent.name)
    }

    if (streetComponent) {
      updateField('street', streetComponent.name)
    }

    if (houseComponent) {
      updateField('house', houseComponent.name)
    }

    // Возвращаем фокус на input после выбора
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const isAddressComplete =
    form.country && form.city && form.street && form.house

  const createOrUpdateTaskMutation = useMutation({
    mutationFn: (payload: CreateTaskData) =>
      isEditMode && task
        ? tasksAPI.updateTask(task.id, payload)
        : tasksAPI.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      onSuccess?.()
      onClose()
    },
    onError: () => {
      alert(t('task.createError') || 'Ошибка при создании задачи')
    }
  })

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert(t('task.titleRequired'))
      return
    }
    if (!form.categoryId) {
      alert(t('task.categoryRequired'))
      return
    }

    createOrUpdateTaskMutation.mutate(form)
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {isEditMode ? t('task.edit') : t('task.create')}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <Field>
          <Label>{t('task.title')} *</Label>
          <Input
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder={t('task.title')}
          />
        </Field>

        <Field>
          <Label>{t('task.description')}</Label>
          <Textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder={t('task.description')}
          />
        </Field>

        <Field>
          <Label>{t('task.category')} *</Label>
          <Select
            value={form.categoryId}
            onChange={e => updateField('categoryId', Number(e.target.value))}
          >
            <option value={0}>{t('task.selectCategory')}</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>
                {t(`categories.${cat.name}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label>{t('task.budget')}</Label>
          <Input
            type="number"
            value={form.budget ?? ''}
            onChange={e =>
              updateField('budget', Number(e.target.value) || undefined)
            }
            placeholder="1000"
          />
        </Field>

        {/* Секция адреса ТОЛЬКО с Яндекс автодополнением */}
        <AddressSection>
          <SectionTitle>{t('task.address')}</SectionTitle>

          <Field>
            <YandexSuggestContainer>
              <Input
                ref={inputRef}
                value={fullAddress}
                onChange={e => handleAddressChange(e.target.value)}
                placeholder="Введите адрес (страна, город, улица, дом)..."
              />
              {isSearching && <LoadingText>Поиск...</LoadingText>}
              {!!showSuggestions && (
                <SuggestList>
                  {suggestions.map((suggestion, index) => (
                    <SuggestItem
                      key={index}
                      onClick={() => handleAddressSelect(suggestion)}
                    >
                      {suggestion.address}
                    </SuggestItem>
                  ))}
                </SuggestList>
              )}
            </YandexSuggestContainer>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Начните вводить адрес для автоматического заполнения
            </p>
          </Field>

          {isAddressComplete && (
            <AddressPreview>
              ✅ Адрес заполнен: {form.country}, {form.city}, {form.street}, д.{' '}
              {form.house}
              {form.latitude && form.longitude && (
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Координаты: {form.latitude.toFixed(6)},{' '}
                  {form.longitude.toFixed(6)}
                </div>
              )}
            </AddressPreview>
          )}
        </AddressSection>

        <Field>
          <Label>{t('task.startDate')}</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={e => updateField('startDate', e.target.value)}
          />
        </Field>

        <Field>
          <Label>{t('task.endDate')}</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={e => updateField('endDate', e.target.value)}
          />
        </Field>

        <ApplyButton
          onClick={handleSubmit}
          disabled={createOrUpdateTaskMutation.isPending}
        >
          {createOrUpdateTaskMutation.isPending
            ? isEditMode
              ? t('task.updating')
              : t('task.creating')
            : isEditMode
            ? t('task.updateButton')
            : t('task.createButton')}
        </ApplyButton>
      </Modal>
    </Overlay>
  )
}
