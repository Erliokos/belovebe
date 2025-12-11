import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAuthStore } from '../stores/authStore'
import { profileAPI, locationsAPI } from '../api/client'
import TemplatesModal from '../components/TemplatesModal'
import { Country, City } from '../types'
import { Select } from '../globalStyle'

const Header = styled.div`
  padding-left: 8px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`

const Container = styled.div`
  padding: 16px;
  max-width: 100%;
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
`

const ProfileSection = styled.div`
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`

const ProfileRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--tg-theme-hint-color, #e0e0e0);

  &:last-child {
    border-bottom: none;
  }
`

const Label = styled.span`
  color: var(--tg-theme-hint-color, #999999);
  font-size: 14px;
`

const Value = styled.span`
  font-weight: 600;
  font-size: 14px;
`

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
`

const Field = styled.div`
  margin-bottom: 16px;
`

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--tg-theme-text-color, #000000);
`

const TemplatesButton = styled.button`
  width: 100%;
  padding: 14px;
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
`

const SaveButton = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 12px;
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

export default function ProfilePage() {
  const { t, i18n: i18nInstance } = useTranslation()
  const { user, setUser } = useAuthStore()
  const [isTemplatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    user?.language || i18nInstance.language || 'ru'
  )
  const queryClient = useQueryClient()

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile
  })

  const isDirty = useMemo(() => {
    return (
      selectedCountryCode !== profileData?.profile?.preferredCountry ||
      selectedCity !== profileData.profile.preferredCity ||
      selectedLanguage !== profileData.language
    )
  }, [profileData, selectedCountryCode, selectedCity, selectedLanguage])

  useEffect(() => {
    if (!profileData) return

    if (profileData.profile?.preferredCountry) {
      setSelectedCountryCode(profileData.profile.preferredCountry)
    }
    if (profileData.profile?.preferredCity) {
      setSelectedCity(profileData.profile.preferredCity)
    }
    if (profileData.language) {
      setSelectedLanguage(profileData.language)
      i18nInstance.changeLanguage(profileData.language)
    }
  }, [profileData])

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: locationsAPI.getCountries
  })

  const { data: cities } = useQuery({
    queryKey: ['cities', selectedCountryCode],
    queryFn: () => locationsAPI.getCities(selectedCountryCode),
    enabled: !!selectedCountryCode
  })

  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: data => {
      setUser(data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (data.language) {
        i18nInstance.changeLanguage(data.language)
      }
    }
  })

  const handleSave = () => {
    updateProfileMutation.mutate({
      preferredCity: selectedCity || undefined,
      preferredCountry: selectedCountryCode || undefined,
      language: selectedLanguage || undefined
    })
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    i18nInstance.changeLanguage(lang)
  }

  const profile = profileData?.profile || user?.profile

  const languages = [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ]

  return (
    <Container>
      <Header>
        <Title>{t('profile.title')}</Title>
      </Header>
      <ProfileSection>
        <ProfileRow>
          <Label>{t('profile.name')}:</Label>
          <Value>{user?.firstName || t('profile.notSpecified')}</Value>
        </ProfileRow>
        {user?.lastName && (
          <ProfileRow>
            <Label>{t('profile.lastName')}:</Label>
            <Value>{user.lastName}</Value>
          </ProfileRow>
        )}
        {user?.username && (
          <ProfileRow>
            <Label>{t('profile.username')}:</Label>
            <Value>@{user.username}</Value>
          </ProfileRow>
        )}
        {profile && (
          <>
            <ProfileRow>
              <Label>{t('profile.rating')}:</Label>
              <Value>{profile.rating?.toFixed(1)}</Value>
            </ProfileRow>
            <ProfileRow>
              <Label>{t('profile.completedTasks')}:</Label>
              <Value>{profile.completedTasks}</Value>
            </ProfileRow>
            <ProfileRow>
              <Label>{t('profile.currentTasks')}:</Label>
              <Value>{profile.currentTasks}</Value>
            </ProfileRow>
          </>
        )}
      </ProfileSection>

      <SectionTitle>{t('profile.title')}</SectionTitle>
      <ProfileSection>
        <Field>
          <FieldLabel>{t('profile.language')}</FieldLabel>
          <Select
            value={selectedLanguage}
            onChange={e => handleLanguageChange(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <FieldLabel>{t('profile.preferredCountry')}</FieldLabel>
          <Select
            value={selectedCountryCode}
            onChange={e => setSelectedCountryCode(e.target.value)}
          >
            <option value="">{t('task.selectCountry')}</option>
            {countries?.map((country: Country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        </Field>

        {selectedCountryCode && cities && (
          <Field>
            <FieldLabel>{t('profile.preferredCity')}</FieldLabel>
            <Select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="">{t('task.selectCity')}</option>
              {cities.map((city: City) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <SaveButton
          onClick={handleSave}
          disabled={updateProfileMutation.isPending || !isDirty}
        >
          {updateProfileMutation.isPending
            ? t('profile.saving')
            : t('profile.save')}
        </SaveButton>
      </ProfileSection>

      <SectionTitle>{t('profile.templates')}</SectionTitle>
      <ProfileSection>
        <TemplatesButton onClick={() => setTemplatesModalOpen(true)}>
          {t('profile.manageTemplates')}
        </TemplatesButton>
      </ProfileSection>

      {isTemplatesModalOpen && (
        <TemplatesModal onClose={() => setTemplatesModalOpen(false)} />
      )}
    </Container>
  )
}
