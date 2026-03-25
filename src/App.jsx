import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminLayout from './components/AdminLayout';
import StallOwnerLayout from './components/StallOwnerLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import FoodStalls from './pages/FoodStalls';
import StallForm from './pages/StallForm';
import Analytics from './pages/Analytics';
import SyncData from './pages/SyncData';
import MapView from './pages/MapView';
import AudioManagement from './pages/AudioManagement';
import SystemAdmin from './pages/SystemAdmin';
import AdminApprovalDashboard from './pages/AdminApprovalDashboard';
import AccountManagement from './pages/AccountManagement';
import MyStall from './pages/StallOwner/MyStall';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import { getRole } from './services/authStorage';

function AppContent() {
  const location = useLocation();
  const authPages = ['/login', '/login/callback'];
  const isAuthPage = authPages.includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<OAuthCallback />} />
      </Routes>
    );
  }

  const userRole = getRole();

  // Stall Owner Routes
  if (userRole === 'RESTAURANT_OWNER' || location.pathname.startsWith('/stall-owner')) {
    return (
      <ProtectedRoute>
        <StallOwnerLayout>
          <Routes>
            <Route path="/stall-owner" element={<MyStall />} />
          </Routes>
        </StallOwnerLayout>
      </ProtectedRoute>
    );
  }

  // Admin Routes (default)
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/approvals" element={<AdminApprovalDashboard />} />
          <Route path="/accounts" element={<AccountManagement />} />
          <Route path="/stalls" element={<FoodStalls />} />
          <Route path="/stalls/new" element={<StallForm />} />
          <Route path="/stalls/:id/edit" element={<StallForm />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sync" element={<SyncData />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/audio" element={<AudioManagement />} />
          <Route path="/system" element={<SystemAdmin />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        toastStyle={{ borderRadius: '12px', fontSize: '14px' }}
      />
    </BrowserRouter>
  );
}

export default App;
