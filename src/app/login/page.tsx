import LoginForm from './LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Teissir Clinic Inventory.',
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm />
}
