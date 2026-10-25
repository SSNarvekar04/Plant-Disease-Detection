import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { FullPageLoader } from './components/LoadingSpinner';

/* Public pages are bundled normally (they are the landing experience). */
import Home from './pages/Home';
import About from './pages/About';
import DiseaseLibrary from './pages/DiseaseLibrary';
import DiseaseDetails from './pages/DiseaseDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

/* Everything behind a login is lazy-loaded, which keeps the first paint small. */
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const DetectDisease = lazy(() => import('./pages/DetectDisease'));
const PredictionResult = lazy(() => import('./pages/PredictionResult'));
const PredictionHistory = lazy(() => import('./pages/PredictionHistory'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageDiseases = lazy(() => import('./pages/admin/ManageDiseases'));
const DiseaseForm = lazy(() => import('./pages/admin/DiseaseForm'));
const ManagePredictions = lazy(() => import('./pages/admin/ManagePredictions'));

/**
 * All application routes.
 *
 * Access control is declared here, not inside the pages:
 *   PublicOnlyRoute -> login/register bounce signed-in users to their area
 *   ProtectedRoute  -> requires a valid JWT
 *   AdminRoute      -> requires the admin role
 */
function AppContent() {
  // Reading the theme from context (instead of the DOM class) means the toast
  // container follows a toggle without needing a remount.
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<FullPageLoader />}>
            <Routes>
              {/* ------------------------------------------------ public */}
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="diseases" element={<DiseaseLibrary />} />
                <Route path="diseases/:id" element={<DiseaseDetails />} />

                <Route element={<PublicOnlyRoute />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                </Route>

                <Route path="404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ------------------------------------------ user (protected) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout variant="user" />}>
                  <Route path="dashboard" element={<UserDashboard />} />
                  <Route path="detect" element={<DetectDisease />} />
                  <Route path="predictions/:id" element={<PredictionResult />} />
                  <Route path="history" element={<PredictionHistory />} />
                  <Route path="profile" element={<UserProfile />} />
                </Route>
              </Route>

              {/* -------------------------------------------------- admin */}
              <Route path="admin/login" element={<AdminLogin />} />

              <Route element={<AdminRoute />}>
                <Route element={<DashboardLayout variant="admin" />}>
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/users" element={<ManageUsers />} />
                  <Route path="admin/diseases" element={<ManageDiseases />} />
                  <Route path="admin/diseases/new" element={<DiseaseForm />} />
                  <Route path="admin/diseases/:id/edit" element={<DiseaseForm />} />
                  <Route path="admin/predictions" element={<ManagePredictions />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            theme={theme}
            toastClassName="text-sm"
          />
        </AuthProvider>
      </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}