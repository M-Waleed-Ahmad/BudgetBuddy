import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// Pages are code-split so visitors of the landing page don't download the
// charting libraries used by the dashboard.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/users/DashboardPage'));
const BudgetManagementPage = lazy(() => import('./pages/users/BudgetManagementPage'));
const ExpenseManagementPage = lazy(() => import('./pages/users/ExpenseManagementPage'));
const SettingsPage = lazy(() => import('./pages/users/SettingsPage'));
const FamilyBudgetingPage = lazy(() => import('./pages/users/FamilyBudgetingPage'));
const NotificationsPage = lazy(() => import('./pages/users/NotificationsPage'));

const PageLoader = () => (
  <div className="page-loader" role="status" aria-label="Loading page">
    <span className="spinner" aria-hidden="true" />
  </div>
);

const protectedRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/budget-management', element: <BudgetManagementPage /> },
  { path: '/expense-management', element: <ExpenseManagementPage /> },
  { path: '/shared-budgeting', element: <FamilyBudgetingPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/settings', element: <SettingsPage /> },
];

const publicOnlyRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
];

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            {/* Reachable while signed in too, since reset links arrive by email. */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {publicOnlyRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={<PublicOnlyRoute>{element}</PublicOnlyRoute>} />
            ))}

            {protectedRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
            ))}

            {/* Legacy paths */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
