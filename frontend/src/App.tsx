import React, { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

// Pages
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Layout from './pages/Layout'
import Workspace from './pages/Workspace'
import CaseVault from './pages/CaseVault'
import ContractGuard from './pages/ContractGuard'
import AIVakil from './pages/AIVakil'
import DocDraft from './pages/DocDraft'
import UpdatePassword from './pages/UpdatePassword'

// Guard
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth Callback handles Google OAuth redirect back to the application
function AuthCallback() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (sessionStorage.getItem('passwordRecovery') === 'true') {
          sessionStorage.removeItem('passwordRecovery')
          navigate('/update-password', { replace: true })
        } else {
          navigate('/workspace', { replace: true })
        }
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [user, loading, navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#141311] text-[#E8B86D]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-[#E8B86D]"></div>
        <p className="font-serif text-lg tracking-wider">COMPLETING SIGN IN...</p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <SignIn />
  },
  {
    path: '/signin',
    element: <SignIn />
  },
  {
    path: '/update-password',
    element: (
      <ProtectedRoute>
        <UpdatePassword />
      </ProtectedRoute>
    )
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: 'workspace',
        element: <Workspace />
      },
      {
        path: 'casevault',
        element: <CaseVault />
      },
      {
        path: 'contractguard',
        element: <ContractGuard />
      },
      {
        path: 'ai-vakil',
        element: <AIVakil />
      },
      {
        path: 'docdraft',
        element: <DocDraft />
      }
    ]
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])

export default function App() {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          sessionStorage.setItem('passwordRecovery', 'true')
        }
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setUser, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
