import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { api } from '../../api/client'

export default function AdminLogin() {
  const navigate = useNavigate()
  const adminToken = useAuthStore((s) => s.adminToken)
  const setAdminToken = useAuthStore((s) => s.setAdminToken)

  useEffect(() => {
    if (adminToken) navigate('/admin', { replace: true })
  }, [adminToken, navigate])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ data: { token: string } }>('/api/auth/admin/login', { username, password })
      setAdminToken(res.data.data.token)
      navigate('/admin', { replace: true })
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col">
      <div className="px-4 pt-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-lg text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold tracking-[0.25em] uppercase text-emerald-500 mb-2">Admin access</p>
          <h1 className="text-4xl font-extrabold text-gray-900">Dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-lg font-medium text-gray-700 mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
              autoComplete="username"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition-all"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-lg font-medium text-gray-700 mb-2">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              required
              autoComplete="current-password"
              className={`w-full border rounded-2xl px-4 py-3.5 text-lg focus:outline-none focus:ring-2 transition-all ${
                error ? 'border-red-300 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-emerald-400 bg-white'
              }`}
            />
            {error && <p className="text-lg text-red-500 mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 active:scale-95 text-white font-semibold text-lg rounded-2xl py-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          >
            {loading ? 'Logging in...' : 'Log in →'}
          </button>
        </form>
      </div>
    </div>
  )
}
