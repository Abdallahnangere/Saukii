'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Loader2, Upload, Lock } from 'lucide-react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'product' | 'plan'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: ''
  });

  // Plan Form State
  const [planForm, setPlanForm] = useState({
    network: 'MTN',
    data: '',
    validity: '30 Days',
    price: '',
    planId: ''
  });

  const checkAuth = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/admin/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
          });
          
          if (res.ok) {
              setIsAuthenticated(true);
          } else {
              alert("Incorrect Password");
          }
      } catch (e) {
          alert("Auth Error");
      } finally {
          setLoading(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setProductForm({ ...productForm, image: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async () => {
    setLoading(true);
    setMessage('');
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productForm)
        });
        if (res.ok) {
            setMessage('Product created successfully!');
            setProductForm({ name: '', description: '', price: '', image: '' });
            setTimeout(() => setView('dashboard'), 1500);
        } else {
            setMessage('Failed to create product.');
        }
    } catch (e) {
        setMessage('Error occurred.');
    } finally {
        setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setMessage('');
    try {
        const res = await fetch('/api/data-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planForm)
        });
        if (res.ok) {
            setMessage('Data plan created successfully!');
            setPlanForm({ network: 'MTN', data: '', validity: '30 Days', price: '', planId: '' });
            setTimeout(() => setView('dashboard'), 1500);
        } else {
            setMessage('Failed to create plan.');
        }
    } catch (e) {
        setMessage('Error occurred.');
    } finally {
        setLoading(false);
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
              <div className="p-8 bg-white rounded-2xl shadow-xl border border-slate-100 space-y-6 w-full max-w-sm text-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-slate-200">
                      <Lock className="text-white w-6 h-6" />
                  </div>
                  <div>
                      <h1 className="text-xl font-bold text-slate-900">Admin Portal</h1>
                      <p className="text-sm text-slate-500">Authorized personnel only</p>
                  </div>
                  <input 
                    type="password" 
                    className="border border-slate-200 p-4 rounded-xl w-full text-center tracking-widest bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-slate-900" 
                    placeholder="Enter Security Key"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    onClick={checkAuth} 
                    disabled={loading}
                    className="bg-slate-900 text-white px-4 py-4 rounded-xl w-full font-bold shadow-lg shadow-slate-200 hover:scale-[1.02] transition-transform"
                  >
                      {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Authenticate'}
                  </button>
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-slate-50 p-6 pb-24">
          <div className="max-w-3xl mx-auto space-y-8">
              <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">SAUKI Admin</h1>
                    <p className="text-sm text-slate-500">Store & Data Management</p>
                </div>
                {view !== 'dashboard' && (
                    <button onClick={() => setView('dashboard')} className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                        Back
                    </button>
                )}
              </header>

              {view === 'dashboard' && (
                  <div className="grid gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <button 
                                onClick={() => setView('product')}
                                className="bg-slate-900 text-white p-6 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all text-left group"
                              >
                                  <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Store</span>
                                  <span className="text-lg font-bold group-hover:underline decoration-white/30">+ Add Product</span>
                              </button>
                              <button 
                                onClick={() => setView('plan')}
                                className="bg-blue-600 text-white p-6 rounded-2xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl transition-all text-left group"
                              >
                                  <span className="text-blue-200 text-xs uppercase tracking-wider block mb-1">Data</span>
                                  <span className="text-lg font-bold group-hover:underline decoration-white/30">+ Add Data Plan</span>
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {view === 'product' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                      <h2 className="text-xl font-bold mb-6">New Product</h2>
                      <div className="space-y-5">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                                  {productForm.image ? (
                                      <img src={productForm.image} alt="Preview" className="h-32 mx-auto object-contain" />
                                  ) : (
                                      <div className="text-slate-400">
                                          <Upload className="w-8 h-8 mx-auto mb-2" />
                                          <span className="text-sm">Click to upload image</span>
                                      </div>
                                  )}
                                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 5G Router"
                                value={productForm.name}
                                onChange={e => setProductForm({...productForm, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                              <textarea 
                                className="w-full border border-slate-200 rounded-xl p-3 h-24 resize-none"
                                placeholder="Short description..."
                                value={productForm.description}
                                onChange={e => setProductForm({...productForm, description: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦)</label>
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="25000"
                                value={productForm.price}
                                onChange={e => setProductForm({...productForm, price: e.target.value})}
                              />
                          </div>
                          
                          {message && <p className={cn("text-sm font-medium text-center", message.includes('Success') ? "text-green-600" : "text-red-600")}>{message}</p>}

                          <button 
                            disabled={loading}
                            onClick={handleCreateProduct}
                            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold mt-2 hover:scale-[1.01] transition-transform flex items-center justify-center"
                          >
                              {loading ? <Loader2 className="animate-spin" /> : 'Publish Product'}
                          </button>
                      </div>
                  </div>
              )}

              {view === 'plan' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                      <h2 className="text-xl font-bold mb-6">New Data Plan</h2>
                      <div className="space-y-5">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Network</label>
                              <select 
                                className="w-full border border-slate-200 rounded-xl p-3 bg-white"
                                value={planForm.network}
                                onChange={e => setPlanForm({...planForm, network: e.target.value})}
                              >
                                  <option value="MTN">MTN</option>
                                  <option value="AIRTEL">AIRTEL</option>
                                  <option value="GLO">GLO</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Data Amount</label>
                              <input 
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 1GB"
                                value={planForm.data}
                                onChange={e => setPlanForm({...planForm, data: e.target.value})}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Validity</label>
                                  <input 
                                    className="w-full border border-slate-200 rounded-xl p-3"
                                    placeholder="e.g. 30 Days"
                                    value={planForm.validity}
                                    onChange={e => setPlanForm({...planForm, validity: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₦)</label>
                                  <input 
                                    type="number"
                                    className="w-full border border-slate-200 rounded-xl p-3"
                                    placeholder="300"
                                    value={planForm.price}
                                    onChange={e => setPlanForm({...planForm, price: e.target.value})}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Amigo Plan ID</label>
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded-xl p-3"
                                placeholder="e.g. 1001"
                                value={planForm.planId}
                                onChange={e => setPlanForm({...planForm, planId: e.target.value})}
                              />
                              <p className="text-xs text-slate-400 mt-1">Must match Amigo API ID exactly.</p>
                          </div>
                          
                          {message && <p className={cn("text-sm font-medium text-center", message.includes('Success') ? "text-green-600" : "text-red-600")}>{message}</p>}

                          <button 
                            disabled={loading}
                            onClick={handleCreatePlan}
                            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-2 hover:bg-blue-700 flex items-center justify-center"
                          >
                              {loading ? <Loader2 className="animate-spin" /> : 'Publish Plan'}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
}