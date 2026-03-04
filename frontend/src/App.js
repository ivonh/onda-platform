import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import BrowseStylists from '@/pages/BrowseStylists';
import ServiceSelectionPage from '@/pages/ServiceSelectionPage';
import ClientDashboard from '@/pages/ClientDashboard';
import StylistDashboard from '@/pages/StylistDashboard';
import BookingPage from '@/pages/EnhancedBookingPage';
import FavoritesPage from '@/pages/FavoritesPage';
import MessagingPage from '@/pages/MessagingPage';
import StylistEarningsPage from '@/pages/StylistEarningsPage';
import StylistProfilePage from '@/pages/StylistProfilePage';
import StylistCalendarPage from '@/pages/StylistCalendarPage';
import StylistAnalyticsPage from '@/pages/StylistAnalyticsPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminOnboarding from '@/pages/admin/AdminOnboarding';
import AdminCredentials from '@/pages/admin/AdminCredentials';
import AdminPhotos from '@/pages/admin/AdminPhotos';
import AdminPayslips from '@/pages/admin/AdminPayslips';
import AdminCommunications from '@/pages/admin/AdminCommunications';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminClients from '@/pages/admin/AdminClients';
import AdminStylists from '@/pages/admin/AdminStylists';
import AdminPartners from '@/pages/admin/AdminPartners';
import AdminAdmins from '@/pages/admin/AdminAdmins';
import AdminTickets from '@/pages/admin/AdminTickets';
import SettingsPage from '@/pages/SettingsPage';
import LoyaltyPage from '@/pages/LoyaltyPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelledPage from '@/pages/PaymentCancelledPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AdminSetupPage from '@/pages/AdminSetupPage';
import AppointmentRatingPage from '@/pages/AppointmentRatingPage';
import { ChatWidget } from '@/components/ChatWidget';
import SplashScreen from '@/components/SplashScreen';
import '@/App.css';

// Layout wrapper to conditionally show footer
function Layout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const noFooterPaths = ['/messages'];
  const showFooter = !noFooterPaths.includes(location.pathname);
  const isLanding = location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation user={user} />
      <main className={`flex-1 ${isLanding ? '' : 'pt-[72px]'}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

// Protected Route component
function ProtectedRoute({ children, allowedRole }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Admin Route component
function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/browse" element={<BrowseStylists />} />
        <Route path="/discover" element={<Navigate to="/browse" replace />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin-setup" element={<AdminSetupPage />} />
        <Route
          path="/rate/:bookingId"
          element={
            <ProtectedRoute allowedRole="client">
              <AppointmentRatingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRole="client">
              <ServiceSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute allowedRole="client">
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stylist/dashboard"
          element={
            <ProtectedRoute allowedRole="stylist">
              <StylistDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stylist/earnings"
          element={
            <ProtectedRoute allowedRole="stylist">
              <StylistEarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stylist/profile"
          element={
            <ProtectedRoute allowedRole="stylist">
              <StylistProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stylist/calendar"
          element={
            <ProtectedRoute allowedRole="stylist">
              <StylistCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stylist/analytics"
          element={
            <ProtectedRoute allowedRole="stylist">
              <StylistAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loyalty"
          element={
            <ProtectedRoute>
              <LoyaltyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/splash" element={<SplashScreen duration={999999} />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="onboarding" element={<AdminOnboarding />} />
          <Route path="credentials" element={<AdminCredentials />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="payslips" element={<AdminPayslips />} />
          <Route path="communications" element={<AdminCommunications />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="stylists" element={<AdminStylists />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="tickets" element={<AdminTickets />} />
        </Route>
        <Route
          path="/booking/:stylistId"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <AppRoutes />
          <ChatWidget />
          <Toaster position="top-right" richColors theme="dark" />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
