import styled from "styled-components"
import { Badge } from "../globalStyle"
import MessageIcon from '../assets/message.svg?react'


const IconMessage = styled.svg`
  width: 20px;
  height: 20px;
  fill: var(--tg-theme-hint-color, #666666);
`

const BadgeMessage = styled(Badge)`
  top: -5px;
  right: -10px;
`

const Container = styled.div`
  position: relative;
`

type NewMessageProps = {
  messageCount: number
}

export function NewMessage({ messageCount }: NewMessageProps) {
  return (
    <Container>
      <IconMessage as={MessageIcon} />
      <BadgeMessage>{messageCount}</BadgeMessage>
    </Container>
  )
}
