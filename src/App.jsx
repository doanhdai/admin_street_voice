import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import FoodStalls from './pages/FoodStalls';
import StallForm from './pages/StallForm';
import Analytics from './pages/Analytics';
import SyncData from './pages/SyncData';
import MapView from './pages/MapView';
import AudioManagement from './pages/AudioManagement';
import SystemAdmin from './pages/SystemAdmin';

function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
