/**
 * Resolve a chat's numeric/string id from API or local state.
 * Backend may return either `id` or `chatId`.
 */
export const getChatId = (chat) => {
  if (!chat) return null;

  const id = chat.id ?? chat.chatId;
  if (id == null || id === '') return null;

  if (typeof id === 'string' && id.startsWith('draft-')) {
    return null;
  }

  return id;
};

/**
 * Ensure chat objects always expose `id` for UI/state code.
 */
export const normalizeChat = (chat) => {
  if (!chat) return chat;

  const id = chat.id ?? chat.chatId;
  if (id == null) return chat;

  return { ...chat, id, chatId: chat.chatId ?? id };
};

export const normalizeChats = (chats) => {
  if (!Array.isArray(chats)) return [];
  return chats.map(normalizeChat);
};
