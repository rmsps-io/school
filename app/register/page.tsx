import { Metadata } from 'next'
import { RegisterForm } from './RegisterForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Registration — RMSPS',
  description: 'Apply for admission to Residential Maa Saraswati Public School',
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f2167] via-[#1a3a8f] to-[#0f2167] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg mx-auto mb-3">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <h1 className="text-xl font-bold text-white">Student Registration</h1>
          <p className="text-sm text-white/60 mt-1">Residential Maa Saraswati Public School</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
          <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
            📋 Form submit karne ke baad admin approve karega. Approve hone par aapko email milega.
          </div>
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          Already account hai?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 underline">
            Login karo
          </Link>
        </p>
      </div>
    </main>
  )
}
