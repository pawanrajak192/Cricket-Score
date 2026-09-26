import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import useStore from './store/useStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateMatch from './pages/CreateMatch';
import Toss from './pages/Toss';
import LiveScoring from './pages/LiveScoring';
import Scorecard from './pages/Scorecard';
import PlayerProfile from './pages/PlayerProfile';

export default function App() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const syncFromServer = useStore((s) => s.syncFromServer);

  // On load (e.g. after a refresh) a signed-up user's session is already
  // in localStorage — pull their latest matches down from the server once.
  useEffect(() => {
    if (user && !user.guest && token) syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-match" element={<ProtectedRoute><CreateMatch /></ProtectedRoute>} />
      <Route path="/match/:id/toss" element={<ProtectedRoute><Toss /></ProtectedRoute>} />
      <Route path="/match/:id/live" element={<ProtectedRoute><LiveScoring /></ProtectedRoute>} />
      <Route path="/player/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />

      {/* Public, read-only — anyone with the link can view */}
      <Route path="/match/:id" element={<Scorecard />} />

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
