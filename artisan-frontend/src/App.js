import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './components/CurrencyContext';

import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import ArtisanRegister from './pages/Login/ArtisanRegister';
import ArtisanLogin from './pages/Login/ArtisanLogin';
import ArtisanProfile from './pages/artisan/artisanProfile';
import MyProducts from './pages/artisan/myProducts';
import AddProduct from './pages/artisan/addProduct';
import EditProduct from './pages/artisan/EditProduct';
import EditProfile from './pages/artisan/EditProfile';
import RegisterClient from './pages/client/RegisterClient';
import ArtisanPublicProfile from './pages/client/ArtisanPublicProfile';
import CategoryPage from './pages/client/CategoryPage';
import ArtisanProducts from './pages/client/ArtisanProducts';
import AdminLogin from './pages/Login/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

import './App.css';

function App() {
  return (
    <CurrencyProvider> {/* Wrap the entire app with the CurrencyProvider to provide currency context to all components */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/artisan-space" element={<ArtisanLogin />} />
          <Route path="/artisan-profile" element={<ArtisanProfile />} />
          <Route path="/artisan_register" element={<ArtisanRegister />} />

          <Route path="/artisan/products" element={<MyProducts />} />
          <Route path="/artisan/add-product" element={<AddProduct />} />
          <Route path="/artisan/my-products" element={<MyProducts />} />

          <Route path="/register" element={<RegisterClient />} />

          <Route path="/artisan/:id" element={<ArtisanPublicProfile />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/artisan/:id/products" element={<ArtisanProducts />} />

          <Route path="/artisan/edit-product/:id" element={<EditProduct />} />
          <Route path="/artisan/edit-profile" element={<EditProfile />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </CurrencyProvider>
  );
}

export default App;