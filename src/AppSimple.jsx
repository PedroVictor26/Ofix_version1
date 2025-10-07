import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TestPage from './pages/TestPage.jsx';

export default function AppSimple() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
}