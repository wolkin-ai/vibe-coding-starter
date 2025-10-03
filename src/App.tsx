import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './app/page';
import TodosPage from './app/todos/page';
import {
  ProjectList,
  ProjectDetail,
  AssetUpload,
  StyleParametersPage,
  GenerationGallery,
  ApprovedExport,
} from './features/salon';

/**
 * Main App component
 *
 * Simple routing setup for the Vibe Coding starter.
 * Add new routes here as you build more features.
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/todos" element={<TodosPage />} />

        {/* Salon Management Routes */}
        <Route path="/salon/projects" element={<ProjectList />} />
        <Route path="/salon/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/salon/projects/:projectId/upload" element={<AssetUpload />} />
        <Route path="/salon/projects/:projectId/approved-export" element={<ApprovedExport />} />
        <Route path="/salon/assets/:assetId/style-parameters" element={<StyleParametersPage />} />
        <Route path="/salon/assets/:assetId/generation-gallery" element={<GenerationGallery />} />

        {/* Add more routes as needed */}
        {/* <Route path="/auth/login" element={<LoginPage />} /> */}
        {/* <Route path="/auth/signup" element={<SignupPage />} /> */}
      </Routes>
    </div>
  );
}

export default App;
