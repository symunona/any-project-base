import { Platform } from 'react-native'

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined'

export interface NotificationsModule {
  register: () => Promise<string>
  requestPermission: () => Promise<NotificationPermissionStatus>
  scheduleLocal: (options: { title: string; body: string; seconds: number }) => Promise<void>
  getBadgeCount: () => Promise<number>
  setBadgeCount: (count: number) => Promise<void>
}

const webStub: NotificationsModule = {
  register:          async () => 'web-stub-token',
  requestPermission: async () => 'granted',
  scheduleLocal:     async () => {},
  getBadgeCount:     async () => 0,
  setBadgeCount:     async () => {},
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native: NotificationsModule = Platform.OS === 'web' ? webStub : require('./notifications.native').default

export const notifications = native
