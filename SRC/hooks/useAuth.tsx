import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface User {
  _id: string
  email: string
  userName?: string
  userRole: 'ADMIN' | 'USER'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      if (email === 'admin@pastelaria.com' && password === 'admin123') {
        const userData: User = {
          _id: '1',
          email,
          userName: 'Administrador',
          userRole: 'ADMIN'
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        toast.success('Login realizado com sucesso!')
      } else {
        throw new Error('Credenciais inválidas')
      }
    } catch (error: unknown) {
      console.error('Erro no login:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro no login: ${errorMessage}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      localStorage.removeItem('user')
      toast.success('Logout realizado com sucesso!')
    } catch (error: unknown) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
      throw error
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      console.log('Checking authentication...')
      try {
        const storedUser = localStorage.getItem('user')
        console.log('Stored user:', storedUser)
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          console.log('Parsed user data:', userData)
          setUser(userData)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        localStorage.removeItem('user')
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}
