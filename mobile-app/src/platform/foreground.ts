import { Platform } from 'react-native'

export interface ForegroundModule {
  defineTask: (name: string, handler: () => Promise<void>) => void
  registerBackgroundFetch: (name: string, options?: { minimumInterval?: number }) => Promise<void>
  unregisterBackgroundFetch: (name: string) => Promise<void>
  isTaskRegistered: (name: string) => Promise<boolean>
}

const webStub: ForegroundModule = {
  defineTask:               () => {},
  registerBackgroundFetch:  async () => {},
  unregisterBackgroundFetch: async () => {},
  isTaskRegistered:         async () => false,
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native: ForegroundModule = Platform.OS === 'web' ? webStub : require('./foreground.native').default

export const foreground = native
