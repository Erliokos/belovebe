import styled from "styled-components"
import { useTranslation } from 'react-i18next'


const ActionButtonWrap = styled.div`
  width: 100%;
  height: 100%;
  padding: 8px;
`
const ActionButton = styled.button`
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  width: 100%;
  height: 100%;
  &:active {
    opacity: 0.8;
  }
`

type ActionButtonShareProps = {
  id: number
  title?: string
}

export function ActionButtonShare({id, title}: ActionButtonShareProps) {
  const { t } = useTranslation()

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()

    const WebApp = (window as any).Telegram?.WebApp
    const message = `Смотри это задание: ${title}`
    const botUsername = 'belovebeBot'
    const payload = `task_${id}`
    const tgWebAppUrl = `https://t.me/${botUsername}/belovebe?startapp=${payload}`

    if (WebApp?.showShareMenu) {
      WebApp.showShareMenu({
        message,
        url: tgWebAppUrl
      })
    } else {
      const url = `https://t.me/share/url?url=${encodeURIComponent(
        tgWebAppUrl
      )}&text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    }
  }

  return (
    <ActionButtonWrap>
      <ActionButton onClick={handleShare}>{t('feed.share')}</ActionButton>
    </ActionButtonWrap>
  )
}

