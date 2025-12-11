import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ResponseTemplate } from '../types'
import { useTranslation } from 'react-i18next'

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  z-index: 2000;
`

const Modal = styled.div`
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  width: 100%;
  max-height: 80vh;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const EmptyStateText = styled.p`
  font-size: 16px;
  margin-bottom: 20px;
`

const TemplatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TemplateItem = styled.div`
  padding: 16px;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 8px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
`

const TemplateView = styled.div``

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const TemplateTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--tg-theme-text-color, #000000);
`

const TemplateActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TemplateContent = styled.p`
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--tg-theme-text-color, #000000);
  white-space: pre-wrap;
  word-break: break-word;
`

const TemplateSum = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: var(--tg-theme-text-color, #000000);
  margin: 0;
`

const TemplateForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);

  &::placeholder {
    color: var(--tg-theme-hint-color, #999999);
  }
`

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);

  &::placeholder {
    color: var(--tg-theme-hint-color, #999999);
  }
`

const ActionButton = styled.button<{
  $variant?: 'primary' | 'secondary' | 'danger'
}>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.8;
  }

  ${({ $variant = 'secondary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: var(--tg-theme-button-color, #3390ec);
          color: var(--tg-theme-button-text-color, #ffffff);
        `
      case 'danger':
        return `
          background-color: #f44336;
          color: #ffffff;
        `
      default:
        return `
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          color: var(--tg-theme-text-color, #000000);
          border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
        `
    }
  }}
`

const AddButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;

  &:active {
    opacity: 0.8;
  }
`

const SaveButton = styled.button`
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
`

interface TemplatesModalProps {
  onClose: () => void
}

type EditMode = {
  index: number
  template: ResponseTemplate
} | null

export default function TemplatesModal({ onClose }: TemplatesModalProps) {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<ResponseTemplate[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTemplate, setNewTemplate] = useState<
    Omit<ResponseTemplate, 'order'>
  >({
    title: '',
    coverLetter: '',
    proposedSum: undefined
  })
  const [editMode, setEditMode] = useState<EditMode>(null)

  useEffect(() => {
    const saved = localStorage.getItem('responseTemplates')
    if (saved) {
      setTemplates(JSON.parse(saved))
    }
  }, [])

  const handleSaveNewTemplate = () => {
    if (!newTemplate.title.trim() || !newTemplate.coverLetter.trim()) {
      return // Можно добавить валидацию
    }

    const templateToSave: ResponseTemplate = {
      ...newTemplate,
      order: templates.length
    }

    const updated = [...templates, templateToSave]
    setTemplates(updated)
    setIsAddingNew(false)
    setNewTemplate({
      title: '',
      coverLetter: '',
      proposedSum: undefined
    })
  }

  const handleSaveEdit = () => {
    if (!editMode) return

    if (
      !editMode.template.title.trim() ||
      !editMode.template.coverLetter.trim()
    ) {
      return // Можно добавить валидацию
    }

    const updated = [...templates]
    updated[editMode.index] = editMode.template
    setTemplates(updated)
    setEditMode(null)
  }

  const handleDelete = (index: number) => {
    const updated = templates.filter((_, i) => i !== index)
    setTemplates(updated)
  }

  const handleCancelAdd = () => {
    setIsAddingNew(false)
    setNewTemplate({
      title: '',
      coverLetter: '',
      proposedSum: undefined
    })
  }

  const handleCancelEdit = () => {
    setEditMode(null)
  }

  const handleSaveAll = () => {
    localStorage.setItem('responseTemplates', JSON.stringify(templates))
    onClose()
  }

  const handleEditTemplate = (index: number, template: ResponseTemplate) => {
    setEditMode({ index, template })
  }

  const handleUpdateNewTemplate = (
    field: keyof typeof newTemplate,
    value: any
  ) => {
    setNewTemplate(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateEditTemplate = (
    field: keyof ResponseTemplate,
    value: any
  ) => {
    if (!editMode) return

    setEditMode({
      ...editMode,
      template: {
        ...editMode.template,
        [field]: value
      }
    })
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{t('templates.title')}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {templates.length === 0 && !isAddingNew ? (
          <EmptyState>
            <EmptyStateText>{t('templates.empty')}</EmptyStateText>
            <AddButton onClick={() => setIsAddingNew(true)}>
              {t('templates.addButton')}
            </AddButton>
          </EmptyState>
        ) : (
          <>
            <TemplatesList>
              {templates.map((template, index) => (
                <TemplateItem key={index}>
                  {editMode?.index === index ? (
                    <TemplateForm>
                      <FormInput
                        value={editMode.template.title}
                        onChange={e =>
                          handleUpdateEditTemplate('title', e.target.value)
                        }
                        placeholder={t('templates.form.titlePlaceholder')}
                      />
                      <FormTextarea
                        value={editMode.template.coverLetter}
                        onChange={e =>
                          handleUpdateEditTemplate(
                            'coverLetter',
                            e.target.value
                          )
                        }
                        placeholder={t('templates.form.coverLetterPlaceholder')}
                      />
                      <FormInput
                        type="number"
                        value={editMode.template.proposedSum || ''}
                        onChange={e =>
                          handleUpdateEditTemplate(
                            'proposedSum',
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        placeholder={t('templates.form.sumPlaceholder')}
                      />
                      <TemplateActions>
                        <ActionButton
                          $variant="primary"
                          onClick={handleSaveEdit}
                        >
                          {t('templates.actions.save')}
                        </ActionButton>
                        <ActionButton
                          $variant="secondary"
                          onClick={handleCancelEdit}
                        >
                          {t('templates.actions.cancel')}
                        </ActionButton>
                      </TemplateActions>
                    </TemplateForm>
                  ) : (
                    <TemplateView>
                      <TemplateHeader>
                        <TemplateTitle>{template.title}</TemplateTitle>
                        <TemplateActions>
                          <ActionButton
                            $variant="secondary"
                            onClick={() => handleEditTemplate(index, template)}
                          >
                            {t('templates.actions.edit')}
                          </ActionButton>
                          <ActionButton
                            $variant="danger"
                            onClick={() => handleDelete(index)}
                          >
                            {t('templates.actions.delete')}
                          </ActionButton>
                        </TemplateActions>
                      </TemplateHeader>
                      <TemplateContent>{template.coverLetter}</TemplateContent>
                      {template.proposedSum && (
                        <TemplateSum>{template.proposedSum} ₽</TemplateSum>
                      )}
                    </TemplateView>
                  )}
                </TemplateItem>
              ))}

              {isAddingNew && (
                <TemplateItem>
                  <TemplateForm>
                    <FormInput
                      value={newTemplate.title}
                      onChange={e =>
                        handleUpdateNewTemplate('title', e.target.value)
                      }
                      placeholder={t('templates.form.titlePlaceholder')}
                    />
                    <FormTextarea
                      value={newTemplate.coverLetter}
                      onChange={e =>
                        handleUpdateNewTemplate('coverLetter', e.target.value)
                      }
                      placeholder={t('templates.form.coverLetterPlaceholder')}
                    />
                    <FormInput
                      type="number"
                      value={newTemplate.proposedSum || ''}
                      onChange={e =>
                        handleUpdateNewTemplate(
                          'proposedSum',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder={t('templates.form.sumPlaceholder')}
                    />
                    <TemplateActions>
                      <ActionButton
                        $variant="primary"
                        onClick={handleSaveNewTemplate}
                      >
                        {t('templates.actions.save')}
                      </ActionButton>
                      <ActionButton
                        $variant="secondary"
                        onClick={handleCancelAdd}
                      >
                        {t('templates.actions.cancel')}
                      </ActionButton>
                    </TemplateActions>
                  </TemplateForm>
                </TemplateItem>
              )}
            </TemplatesList>

            {!isAddingNew && (
              <AddButton onClick={() => setIsAddingNew(true)}>
                {t('templates.addButton')}
              </AddButton>
            )}

            {templates.length > 0 && (
              <SaveButton onClick={handleSaveAll}>
                {t('templates.saveAllButton')}
              </SaveButton>
            )}
          </>
        )}
      </Modal>
    </Overlay>
  )
}
