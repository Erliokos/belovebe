import { create } from 'zustand';
import { UnreadMessage } from '../types';

interface NotificationState {
  unreadMessage: UnreadMessage['myUnreadMessageCount']
  setUnreadMessage: (value: UnreadMessage['myUnreadMessageCount']) => void
}

export const useNotificationState = create<NotificationState>((set) => ({
  unreadMessage: [],
  setUnreadMessage: (unreadMessage) => { set({ unreadMessage }) }
}));
