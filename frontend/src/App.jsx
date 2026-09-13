import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoatProfile from './pages/BoatProfile';
import AddBoat from './pages/AddBoat';
import EditBoat from './pages/EditBoat';
import Settings from './pages/Settings';
import PublicBoat from './pages/PublicBoat';
import Maintenance from './pages/Maintenance';
import Wiki from './pages/Wiki';
import Chat from './pages/Chat';
import Admin from './pages/Admin';

// Leaflet is heavy; only load it when someone actually plans a passage
const Passage = lazy(() => import('./pages/Passage'));
const Landing = lazy(() => import('./pages/Landing'));

function NavLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Outlet />
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ErrorBoundary><Suspense fallback={<Spinner />}><Landing /></Suspense></ErrorBoundary>} />
          <Route path="/login" element={<Login />} />
          <Route path="/boats/public/:id" element={<PublicBoat />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<NavLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/boats/new" element={<AddBoat />} />
              <Route path="/boats/:id" element={<BoatProfile />} />
              <Route path="/boats/:id/edit" element={<EditBoat />} />
              <Route path="/boats/:id/maintenance" element={<Maintenance />} />
              <Route path="/boats/:id/wiki" element={<Wiki />} />
              <Route path="/boats/:id/chat" element={<Chat />} />
              <Route path="/boats/:id/passage" element={<ErrorBoundary><Suspense fallback={<Spinner />}><Passage /></Suspense></ErrorBoundary>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
