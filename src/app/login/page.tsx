import LoginForm from './LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In – Teissir Dental Inventory',
  description: 'Sign in to the Teissir Dental Clinic inventory system.',
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginForm />
}
