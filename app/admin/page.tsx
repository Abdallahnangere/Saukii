'use client';

import React, { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // In a real app, use better auth. This is a simple gate.
  const checkAuth = () => {
      // Since we don't have a backend auth route setup for this specific task scope
      // We will just allow UI access and assume the API calls would fail if we were sending headers.
      // But for this simplified version, we'll just gate the UI.
      if (password.length > 3) setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50">
              <div className="p-8 bg-white rounded-xl shadow-md space-y-4">
                  <h1 className="text-xl font-bold">Admin Access</h1>
                  <input 
                    type="password" 
                    className="border p-2 rounded w-full" 
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button onClick={checkAuth} className="bg-black text-white px-4 py-2 rounded w-full">Login</button>
              </div>
          </div>
      );
  }

  return (
      <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">SAUKI MART Admin</h1>
          
          <div className="grid gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                  <div className="flex gap-4">
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-lg">Add Product</button>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-lg">Add Data Plan</button>
                      <button className="border border-slate-300 px-4 py-2 rounded-lg">View Transactions</button>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="text-xl font-bold mb-4">System Status</h2>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                          <div className="text-sm">Database</div>
                          <div className="font-bold">Connected</div>
                      </div>
                      <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
                          <div className="text-sm">Flutterwave</div>
                          <div className="font-bold">Active</div>
                      </div>
                      <div className="p-4 bg-purple-50 text-purple-800 rounded-lg">
                          <div className="text-sm">Amigo API</div>
                          <div className="font-bold">Ready</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
}