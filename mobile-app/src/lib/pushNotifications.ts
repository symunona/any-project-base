import { Platform } from 'react-native'
import { notifications } from '../platform/notifications'
import { client } from '@any-project-base/commons/api/client'

export async function registerDevice(userId: string): Promise<void> {
  const status = await notifications.requestPermission()
  if (status !== 'granted') return

  const token = await notifications.register()
  const platform = Platform.OS as 'android' | 'ios' | 'web'

  await client.api.devices.$post({
    json: { token, platform, user_id: userId },
  })
}

export async function unregisterDevice(token: string): Promise<void> {
  await client.api.devices[':token'].$delete({ param: { token } })
}
