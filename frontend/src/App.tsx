import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Register, Login, Dashboard, AgileBoard, Backlog, TeamChat, Reports } from './pages';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
               <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/projects/:id/board" element={<AgileBoard />} />
               <Route path="/projects/:id/backlog" element={<Backlog />} />
               <Route path="/projects/:id/chat" element={<TeamChat />} />
               <Route path="/projects/:id/reports" element={<Reports />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
