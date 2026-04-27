import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import BillsPage from './pages/Bills/BillsPage'
import VendorsPage from './pages/Vendors/VendorsPage'
import VendorDetailPage from './pages/Vendors/VendorDetailPage'
import PaymentsPage from './pages/Payments/PaymentsPage'
import BillFormPage from './pages/Bills/BillFormPage'
import BillDetailPage from './pages/Bills/BillDetailPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import SettingsPage from './pages/Settings/SettingsPage'
import LandingPage from './pages/LandingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/bills/new" element={<BillFormPage />} />
        <Route path="/bills/:id/edit" element={<BillFormPage />} />
        <Route path="/bills/:id" element={<BillDetailPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendors/:id" element={<VendorDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
