import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import ScanDetailsPage from './pages/ScanDetailsPage';
import './App.css';

function App() {
  const { user } = useAuth();

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ScanHistoryPage />} />
          <Route path="/scan/:id" element={<ScanDetailsPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;