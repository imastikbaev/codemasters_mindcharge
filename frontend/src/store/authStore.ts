import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'psychologist' | 'director' | 'admin'
  age_group: 'child' | 'teen' | 'adult'
  preferred_language: string
  institution_id?: string
  group_name?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateLanguage: (lang: string) => void
}

const storedUser = localStorage.getItem('user')
const storedToken = localStorage.getItem('token')

export const useAuthStore = create<AuthStore>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  updateLanguage: (lang) => {
    set((state) => {
      if (state.user) {
        const updated = { ...state.user, preferred_language: lang }
        localStorage.setItem('user', JSON.stringify(updated))
        return { user: updated }
      }
      return {}
    })
  },
}))
