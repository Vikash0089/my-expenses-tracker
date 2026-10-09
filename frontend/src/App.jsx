import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import { People, PersonDetail } from './pages/People';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Recurring from './pages/Recurring';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/calendar/:year?/:month?/:day?" element={<CalendarPage />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/people" element={<People />} />
        <Route path="/people/:id" element={<PersonDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route
        path="*"
        element={
          <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
            <p className="text-5xl">🧭</p>
            <h1 className="text-xl font-semibold">Page not found</h1>
            <a href="/" className="btn-primary">Back to dashboard</a>
          </div>
        }
      />
    </Routes>
  );
}
