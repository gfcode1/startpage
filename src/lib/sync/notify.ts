import { notifications } from '@mantine/notifications'

export function showSyncNotification(
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message?: string,
) {
  const colors = {
    success: 'green',
    error: 'red',
    info: 'blue',
    warning: 'yellow',
  }

  notifications.show({
    title,
    message: message ?? '',
    color: colors[type],
    autoClose: type === 'success' ? 3000 : 5000,
    withCloseButton: true,
  })
}
