import { Platform } from 'react-native'

export interface CaptureResult {
  uri: string
  width: number
  height: number
  base64?: string
}

export interface CameraModule {
  requestPermission: () => Promise<boolean>
  capturePhoto: () => Promise<CaptureResult | null>
  pickFromLibrary: () => Promise<CaptureResult | null>
}

const webStub: CameraModule = {
  requestPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
      return true
    } catch {
      return false
    }
  },
  capturePhoto:     async () => null,
  pickFromLibrary:  async () => null,
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native: CameraModule = Platform.OS === 'web' ? webStub : require('./camera.native').default

export const camera = native
