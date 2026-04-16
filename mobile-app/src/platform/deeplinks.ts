import { Platform } from 'react-native'

export interface DeeplinksModule {
  getInitialURL: () => Promise<string | null>
  addEventListener: (handler: (url: string) => void) => () => void
  openURL: (url: string) => Promise<void>
  canOpenURL: (url: string) => Promise<boolean>
}

const webStub: DeeplinksModule = {
  getInitialURL:  async () => null,
  addEventListener: (handler) => {
    const listener = (e: MessageEvent) => { if (typeof e.data === 'string' && e.data.startsWith('anyprojectbase://')) handler(e.data) }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  },
  openURL:   async (url) => { window.location.href = url },
  canOpenURL: async () => true,
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native: DeeplinksModule = Platform.OS === 'web' ? webStub : require('./deeplinks.native').default

export const deeplinks = native
