import { useState } from 'react'
import { useParams, useNavigate, useNavigationType } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import styled from 'styled-components'
import { tasksAPI, responsesAPI } from '../api/client'
import { ResponseTemplate } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from 'react-i18next'

const Container = styled.div`
  padding: 16px;
  padding-bottom: 64px;
  max-width: 100%;
`

const BackButton = styled.button`
  margin-bottom: 16px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--tg-theme-button-color, #3390ec);
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`

const CategoryBadge = styled.span`
  display: inline-block;
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 16px;
`

const Description = styled.p`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  color: var(--tg-theme-text-color, #000000);
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--tg-theme-hint-color, #e0e0e0);
`

const InfoLabel = styled.span`
  color: var(--tg-theme-hint-color, #999999);
`

const InfoValue = styled.span`
  font-weight: 600;
`

const ResponseSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
`

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
`

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`

const TemplateButton = styled.button`
  padding: 12px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;

  &:active {
    opacity: 0.8;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Input = styled.input`
  padding: 12px;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 8px;
  font-size: 14px;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
`

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 8px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
  font-family: inherit;
`

const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: 14px;
  background-color: ${props =>
    props.disabled
      ? 'var(--tg-theme-hint-color, #999999)'
      : 'var(--tg-theme-button-color, #3390ec)'};
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

  &:active {
    opacity: ${props => (props.disabled ? 1 : 0.8)};
  }
`

const LoadingText = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const MyTaskBadge = styled.span`
  background-color: #44cc44;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
`

export default function TaskDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const canGoBack = navigationType !== 'POP'
  const queryClient = useQueryClient()
  const [proposedSum, setProposedSum] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const currentUser = useAuthStore(state => state.user)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksAPI.getTask(Number(id))
  })

  const isMyTask = currentUser?.id === task?.author.id
  const hasUserResponse = task?.hasUserResponse || false

  const templates: ResponseTemplate[] = JSON.parse(
    localStorage.getItem('responseTemplates') || '[]'
  )

  const mutation = useMutation({
    mutationFn: (data: {
      taskId: number
      proposedSum?: number
      coverLetter: string
    }) => responsesAPI.createResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/responses')
    }
  })

  const handleTemplateClick = (template: ResponseTemplate) => {
    setProposedSum(template.proposedSum?.toString() || '')
    setCoverLetter(template.coverLetter)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!coverLetter.trim() || !id) return

    mutation.mutate({
      taskId: Number(id),
      proposedSum: proposedSum ? parseFloat(proposedSum) : undefined,
      coverLetter: coverLetter.trim()
    })
  }

  if (isLoading) {
    return (
      <Container>
        <LoadingText>{t('taskDetail.loading')}</LoadingText>
      </Container>
    )
  }

  if (!task) {
    return (
      <Container>
        <LoadingText>{t('taskDetail.notFound')}</LoadingText>
      </Container>
    )
  }

  const isFormValid = coverLetter.trim().length > 0

  return (
    <Container>
      {canGoBack && (
        <BackButton onClick={() => navigate(-1)}>
          ← {t('common.back')}
        </BackButton>
      )}
      <Title>
        {task.title}{' '}
        {isMyTask && <MyTaskBadge>{t('feed.isMyTask')}</MyTaskBadge>}
      </Title>
      <CategoryBadge>{t(`categories.${task.category.name}`)}</CategoryBadge>
      <Description>{task.description}</Description>

      <InfoRow>
        <InfoLabel>{t('taskDetail.budget')}:</InfoLabel>
        <InfoValue>
          {task.budget
            ? `${task.budget.toLocaleString()} ₽`
            : t('taskDetail.notSpecified')}
        </InfoValue>
      </InfoRow>
      <InfoRow>
        <InfoLabel>{t('taskDetail.author')}:</InfoLabel>
        <InfoValue>
          {task.author.firstName ||
            task.author.username ||
            t('taskDetail.notSpecified')}
        </InfoValue>
      </InfoRow>
      <InfoRow>
        <InfoLabel>{t('taskDetail.startDate')}:</InfoLabel>
        <InfoValue>
          {task.startDate
            ? new Date(task.startDate).toLocaleDateString()
            : t('taskDetail.notSpecified')}
        </InfoValue>
      </InfoRow>
      <InfoRow>
        <InfoLabel>{t('taskDetail.deadline')}:</InfoLabel>
        <InfoValue>
          {task.endDate
            ? new Date(task.endDate).toLocaleDateString()
            : t('taskDetail.notSpecified')}
        </InfoValue>
      </InfoRow>
      <InfoRow>
        <InfoLabel>{t('taskDetail.views')}:</InfoLabel>
        <InfoValue>{task.viewsCount}</InfoValue>
      </InfoRow>
      {task._count && (
        <InfoRow>
          <InfoLabel>{t('taskDetail.responsesCount')}:</InfoLabel>
          <InfoValue>{task._count.responses}</InfoValue>
        </InfoRow>
      )}
      {!isMyTask && !hasUserResponse && (
        <ResponseSection>
          <SectionTitle>{t('taskDetail.makeProposal')}</SectionTitle>
          {templates.length > 0 && (
            <>
              <SectionTitle style={{ fontSize: '14px', marginBottom: '8px' }}>
                {t('taskDetail.templates')}:
              </SectionTitle>
              <TemplatesGrid>
                {templates.slice(0, 6).map((template, index) => (
                  <TemplateButton
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                  >
                    {template.title}
                  </TemplateButton>
                ))}
              </TemplatesGrid>
            </>
          )}
          <Form onSubmit={handleSubmit}>
            <Input
              type="number"
              placeholder={t('templates.form.sumPlaceholder')}
              value={proposedSum}
              onChange={e => setProposedSum(e.target.value)}
            />
            <Textarea
              placeholder={t('taskDetail.proposalPlaceholder')}
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              required
            />
            <SubmitButton
              type="submit"
              disabled={!isFormValid || mutation.isPending}
            >
              {mutation.isPending
                ? t('taskDetail.submitting')
                : t('taskDetail.submitProposal')}
            </SubmitButton>
          </Form>
        </ResponseSection>
      )}
    </Container>
  )
}
