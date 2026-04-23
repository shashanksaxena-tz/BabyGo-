import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChildProvider, useChild } from './contexts/ChildContext';

import Layout from './layouts/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Analysis from './pages/Analysis';
import AnalysisResult from './pages/AnalysisResult';
import Milestones from './pages/Milestones';
import Timeline from './pages/Timeline';
import GrowthCharts from './pages/GrowthCharts';
import Stories from './pages/Stories';
import Recipes from './pages/Recipes';
import Recommendations from './pages/Recommendations';
import Resources from './pages/Resources';
import HealthHub from './pages/HealthHub';
import Community from './pages/Community';
import Reports from './pages/Reports';
import WHOEvidence from './pages/WHOEvidence';
import Profile from './pages/Profile';
import ImproveDomain from './pages/ImproveDomain';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateChild from './pages/CreateChild';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading: authLoading } = useAuth();
  const { children: kids, loading: childLoading } = useChild();
  const location = useLocation();

  if (authLoading || childLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // If user is authenticated but has no children, redirect to create child page
  // UNLESS they are already on the create child page
  if (kids.length === 0 && location.pathname !== '/create-child') {
    return <Navigate to="/create-child" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/create-child" element={<ProtectedRoute><CreateChild /></ProtectedRoute>} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="insights" element={<Insights />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="analysis/result" element={<AnalysisResult />} />
              <Route path="milestones" element={<Milestones />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="growth" element={<GrowthCharts />} />
              <Route path="stories" element={<Stories />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="health-hub" element={<HealthHub />} />
              <Route path="resources" element={<Resources />} />
              <Route path="community" element={<Community />} />
              <Route path="reports" element={<Reports />} />
              <Route path="who-evidence" element={<WHOEvidence />} />
              <Route path="improve-domain" element={<ImproveDomain />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
