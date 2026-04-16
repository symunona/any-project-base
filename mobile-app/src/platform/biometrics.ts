import { Platform } from 'react-native'

export type BiometryType = 'fingerprint' | 'faceid' | 'iris' | 'none'

export interface BiometricsModule {
  isAvailable: () => Promise<boolean>
  getBiometryType: () => Promise<BiometryType>
  authenticate: (reason: string) => Promise<boolean>
}

const webStub: BiometricsModule = {
  isAvailable:    async () => false,
  getBiometryType: async () => 'none',
  authenticate:   async () => true,
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native: BiometricsModule = Platform.OS === 'web' ? webStub : require('./biometrics.native').default

export const biometrics = native
