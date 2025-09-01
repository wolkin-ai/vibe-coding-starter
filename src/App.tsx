import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './app/page';
import TodosPage from './app/todos/page';

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

        {/* Add more routes as needed */}
        {/* <Route path="/auth/login" element={<LoginPage />} /> */}
        {/* <Route path="/auth/signup" element={<SignupPage />} /> */}
      </Routes>
    </div>
  );
}

export default App;
