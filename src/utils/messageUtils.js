import { format, isToday, isValid, isYesterday } from 'date-fns';

export const getMessageTimestamp = (message) =>
  message?.createdAt || message?.timestamp || message?.sentAt;

export const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
};

/** Compact time shown inside the message bubble */
export const formatMessageTimeShort = (timestamp) => {
  const date = parseDate(timestamp);
  if (!date) return '';
  return format(date, 'h:mm a');
};

/** Sent time: time only for today, date for older messages */
export const formatMessageTime = (timestamp) => {
  const date = parseDate(timestamp);
  if (!date) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, yyyy h:mm a');
};

/** Read time: time if read today, date (+ time) if read on an earlier day */
export const formatReadTimestamp = (readAt) => {
  const date = parseDate(readAt);
  if (!date) return null;

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, yyyy h:mm a');
};

export const formatReadLabel = (readAt) => {
  const formatted = formatReadTimestamp(readAt);
  if (!formatted) return 'Not read yet';
  return `Read ${formatted}`;
};

const getStatusUserId = (status) => status?.userId ?? status?.id;

const getStatusUserName = (status) =>
  status?.fullName || status?.username || status?.name || 'User';

export const getReadEntries = (message, { excludeUserIds = [] } = {}) => {
  if (!message?.readUnreadStatus?.length) return [];

  return message.readUnreadStatus
    .filter(
      (status) =>
        status?.read &&
        status?.readAt &&
        !excludeUserIds.includes(getStatusUserId(status))
    )
    .map((status) => ({
      userId: getStatusUserId(status),
      name: getStatusUserName(status),
      readAt: status.readAt
    }))
    .sort((a, b) => new Date(b.readAt) - new Date(a.readAt));
};

export const getUnreadEntries = (message, { excludeUserIds = [] } = {}) => {
  if (!message?.readUnreadStatus?.length) return [];

  return message.readUnreadStatus
    .filter(
      (status) =>
        !status?.read && !excludeUserIds.includes(getStatusUserId(status))
    )
    .map((status) => ({
      userId: getStatusUserId(status),
      name: getStatusUserName(status)
    }));
};

export const getLatestReadAt = (message, excludeUserIds = []) => {
  const readEntries = getReadEntries(message, { excludeUserIds });
  if (readEntries.length > 0) {
    return readEntries[0].readAt;
  }

  return message?.readAt || message?.readTime || null;
};

export const isMessageRead = (message) => {
  if (message?.read === true || message?.status === 'read') return true;
  if (message?.readUnreadStatus?.some((status) => status?.read)) return true;
  return Boolean(message?.readAt || message?.readTime);
};
