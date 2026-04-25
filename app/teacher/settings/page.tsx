import { Metadata } from 'next'
import { SettingsPage } from '@/components/shared/SettingsPage'

export const metadata: Metadata = { title: 'Settings' }

export default function TeacherSettingsPage() {
  return <SettingsPage />
}
