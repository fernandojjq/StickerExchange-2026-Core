import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Album } from './pages/Album';
import { Swap } from './pages/Swap';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

function App() {
  useEffect(() => {
    if (window.removeInitialLoader) {
      window.removeInitialLoader();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Album />} />
          <Route path="swap" element={<Swap />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
