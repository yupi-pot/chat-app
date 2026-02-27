import { useChatStore } from '../store/chat.store';

export function useChat() {
  return useChatStore();
}
