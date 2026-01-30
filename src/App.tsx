import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { PartsPage } from '@/pages/PartsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { useAuth } from '@/lib/auth-context'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center brand-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </>
    )
  }

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/clienti" element={<CustomersPage />} />
          <Route path="/clienti/:id" element={<CustomerDetailPage />} />
          <Route path="/ricambi" element={<PartsPage />} />
          <Route path="/profilo" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/clienti" replace />} />
          <Route path="*" element={<Navigate to="/clienti" replace />} />
        </Routes>
      </AppShell>
      <Toaster />
    </>
  )
}

export default App
