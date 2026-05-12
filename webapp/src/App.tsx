import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// KTV Pages
import ReportForm from './pages/ktv/ReportForm';
import MyReports from './pages/ktv/MyReports';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ReportList from './pages/admin/ReportList';
import UserManage from './pages/admin/UserManage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<Layout />}>
            {/* KTV Routes */}
            <Route element={<ProtectedRoute allowedRoles={['KTV']} />}>
              <Route path="/ktv/report" element={<ReportForm />} />
              <Route path="/ktv/my-reports" element={<MyReports />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/reports" element={<ReportList />} />
              <Route path="/admin/users" element={<UserManage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
