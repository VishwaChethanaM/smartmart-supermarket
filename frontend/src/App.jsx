import React, { useState, useEffect } from 'react';
import { ShoppingBag, Leaf, Egg, Croissant, Coffee, ShoppingCart, Lock, LogOut, PlusCircle, Trash2, UserPlus, CreditCard, Receipt, Users, Edit3, Save, XCircle, CheckCircle2, ArrowRight, HelpCircle, KeyRound, Check, AlertTriangle, History, Search, Plus, Minus, IndianRupee, Truck } from 'lucide-react';

const IconMap = {
  Leaf: <Leaf className="w-5 h-5" />,
  Egg: <Egg className="w-5 h-5" />,
  Croissant: <Croissant className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />
};

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState('store');
  
  // FEATURE 5: USER SESSION PERSISTENCE FROM LOCALSTORAGE
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartmart_session');
    return saved ? JSON.parse(saved) : null;
  });

  // FEATURE 5: BASKET DATA PERSISTENCE
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('smartmart_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // FEATURE 2: SEARCH QUERY STATE
  const [searchQuery, setSearchQuery] = useState('');

  // FEATURE 1 & 4: ADMINISTRATIVE REVENUE & ORDER DESK STATES
  const [analytics, setAnalytics] = useState({ total_revenue: 0, total_orders: 0 });
  const [adminOrders, setAdminOrders] = useState([]);

  // Common Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Password Reset Tracker Forms
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetRequestsList, setResetRequestsList] = useState([]);

  // Customer History State Repo
  const [pastOrders, setPastOrders] = useState([]);

  // Store Layout Repositories
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Inline Catalog Modification States
  const [editingProductId, setEditingProductId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStock, setEditStock] = useState('100'); 

  // Checkout Form Models
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [finalInvoice, setFinalInvoice] = useState(null);

  // Creator Forms States
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('1');
  const [newProdStock, setNewProdStock] = useState('100'); 
  const [newProdOrganic, setNewProdOrganic] = useState(false);
  const [newProdImage, setNewProdImage] = useState('');

  // Save Cart to localstorage on change
  useEffect(() => {
    localStorage.setItem('smartmart_cart', JSON.stringify(cart));
  }, [cart]);

  // Save Session to localstorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('smartmart_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartmart_session');
    }
  }, [user]);

  const refreshData = () => {
    fetch('http://127.0.0.1:8000/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    const url = selectedCategory 
      ? `http://127.0.0.1:8000/api/products?category_id=${selectedCategory}`
      : 'http://127.0.0.1:8000/api/products';
      
    fetch(url)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));

    if (user && user.role === 'admin') {
      fetch('http://127.0.0.1:8000/api/admin/users')
        .then(res => res.ok ? res.json() : [])
        .then(data => setAllUsers(Array.isArray(data) ? data : []));

      fetch('http://127.0.0.1:8000/api/admin/reset-requests')
        .then(res => res.ok ? res.json() : [])
        .then(data => setResetRequestsList(Array.isArray(data) ? data : []));

      // FEATURE 1 & 4: REVENUE ANALYTICS & LOG ORDERS FETCH
      fetch('http://127.0.0.1:8000/api/admin/analytics')
        .then(res => res.json())
        .then(data => setAnalytics(data));

      fetch('http://127.0.0.1:8000/api/admin/orders')
        .then(res => res.json())
        .then(data => setAdminOrders(data));
    }

    if (user && user.role === 'user') {
      fetch(`http://127.0.0.1:8000/api/orders/history?customer_name=${user.username}`)
        .then(res => res.json())
        .then(data => setPastOrders(data))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => { refreshData(); }, [selectedCategory, user, currentView]);

  useEffect(() => {
    if (user && user.role === 'user') {
      setCustomerName(user.username);
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // FEATURE 4: ADMIN DELIVERY TRACKING SWITCH MODIFIER
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    fetch(`http://127.0.0.1:8000/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(() => refreshData());
  };

  // FEATURE 3: SHOPPING BASKET COUNTER ADJUSTMENT MODIFIERS
  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.qty + delta;
          // Deduct item if quantity hits 0
          if (newQty <= 0) return null;
          // Restrict addition if it exceeds database stock boundaries
          if (delta > 0 && newQty > item.stock_quantity) {
            alert(`Sorry, only ${item.stock_quantity} units are available in stock!`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRequestPasswordReset = (e) => {
    e.preventDefault(); setResetMessage('');
    fetch('http://127.0.0.1:8000/api/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: resetUsername, new_password: resetNewPassword })
    })
    .then(async res => {
      if (!res.ok) throw new Error('Username record not found inside database.');
      return res.json();
    })
    .then(data => { setResetMessage(data.message); setResetUsername(''); setResetNewPassword(''); })
    .catch(err => setResetMessage(err.message));
  };

  const handleAdminResetAction = (id, action) => {
    fetch('http://127.0.0.1:8000/api/admin/approve-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, action: action })
    }).then(() => refreshData());
  };

  const handleLogin = (e) => {
    e.preventDefault(); setAuthError(''); setAuthSuccess('');
    fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
    .then(async res => {
      if (!res.ok) throw new Error('Invalid username or password configuration.');
      return res.json();
    })
    .then(data => {
      setUser({ username: data.username, role: data.role, phone: data.phone_number || '' });
      setUsernameInput(''); setPasswordInput(''); setCurrentView('store');
    })
    .catch(err => setAuthError(err.message));
  };

  const handleSignUp = (e) => {
    e.preventDefault(); setAuthError('');
    fetch('http://127.0.0.1:8000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput, phone_number: phoneInput })
    })
    .then(async res => {
      if(!res.ok) throw new Error("Username already taken.");
      return res.json();
    })
    .then(data => {
      setAuthSuccess(`Account "${data.username}" initialized successfully! Please login.`);
      setCurrentView('login');
      setUsernameInput(''); setPasswordInput(''); setPhoneInput('');
    })
    .catch(err => setAuthError(err.message));
  };

  const startCheckout = (e) => { e.preventDefault(); setIsCartOpen(false); setCurrentView('payment'); };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const trackingItems = cart.map(item => ({ id: item.id, qty: item.qty }));

    fetch('http://127.0.0.1:8000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone, total_amount: total, items: trackingItems })
    })
    .then(res => res.json())
    .then(data => {
      setFinalInvoice({ orderId: data.id || Math.floor(1000 + Math.random()*9000), date: new Date().toLocaleString('en-IN'), name: customerName, email: customerEmail, phone: customerPhone, items: [...cart], total: total });
      setCart([]); 
      setCurrentView('receipt');
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:8000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProdName, description: newProdDesc, price: parseFloat(newProdPrice), stock_quantity: parseInt(newProdStock), image_url: newProdImage || "https://images.unsplash.com/photo-1542838132-92c53300491e", is_organic: newProdOrganic, category_id: parseInt(newProdCat) })
    }).then(() => { setNewProdName(''); setNewProdPrice(''); setNewProdDesc(''); setNewProdStock('100'); setNewProdImage(''); refreshData(); });
  };

  const saveProductEdits = (product) => {
    fetch(`http://127.0.0.1:8000/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, price: parseFloat(editPrice), stock_quantity: parseInt(editStock), image_url: product.image_url, is_organic: product.is_organic, category_id: product.category_id })
    }).then(() => { setEditingProductId(null); refreshData(); });
  };

  const handleDeleteProduct = (id) => {
    fetch(`http://127.0.0.1:8000/api/admin/products/${id}`, { method: 'DELETE' }).then(() => refreshData());
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return; 
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        if (exist.qty >= product.stock_quantity) {
          alert("Cannot exceed total active units in warehouse stock!");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // FEATURE 2: SEARCH FILTER ENGINE INTERACTION COMPUTATION
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => { setCurrentView('store'); setSearchQuery(''); }}>
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white"><ShoppingBag className="w-5 h-5" /></div>
            <span className="text-lg font-black tracking-tight text-gray-900">Smart<span className="text-emerald-600">Mart</span></span>
          </div>

          {/* FEATURE 2: DYNAMIC SEARCH BAR INPUT LAYOUT */}
          {currentView === 'store' && (!user || user.role !== 'admin') && (
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search premium groceries, departments..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="flex items-center gap-6 font-semibold text-sm text-gray-600 shrink-0">
            <button onClick={() => setCurrentView('store')} className={currentView === 'store' ? 'text-emerald-600 font-bold' : ''}>Shop</button>
            {user && user.role === 'user' && (
              <button onClick={() => setCurrentView('history')} className={`flex items-center gap-1 ${currentView === 'history' ? 'text-emerald-600 font-bold' : ''}`}><History className="w-4 h-4" /> Past Orders</button>
            )}
            {!user ? (
              <>
                <button onClick={() => setCurrentView('login')} className={currentView === 'login' ? 'text-emerald-600 font-bold' : ''}><Lock className="w-4 h-4 inline mr-1" /> Sign In</button>
                <button onClick={() => setCurrentView('signup')} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl">Sign Up</button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">User: <b className="text-gray-700">{user.username}</b></span>
                {user.role === 'user' && <button onClick={() => setIsCartOpen(true)} className="px-4 py-2 bg-gray-950 text-white rounded-xl text-xs font-bold">Cart ({cart.reduce((s,i)=>s+i.qty,0)})</button>}
                <button onClick={() => { setUser(null); setCart([]); setCurrentView('store'); }} className="p-2 text-gray-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        
        {/* VIEW 1: ORDER HISTORY VIEW GRID */}
        {currentView === 'history' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2"><History className="text-emerald-600" /> Your Purchase History</h2>
            <p className="text-xs text-gray-400 mb-6">Every single item order committed securely to your profile row node.</p>
            {pastOrders.length === 0 ? (
              <p className="text-sm text-gray-400 font-medium py-6 text-center">You haven't completed any supermarket orders yet.</p>
            ) : (
              <div className="space-y-4">
                {pastOrders.map(order => (
                  <div key={order.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-400">ORDER ID: #SM-{order.id}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Purchased on: {order.created_at}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900">₹{order.total_amount.toFixed(2)}</div>
                      <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black mt-1 uppercase tracking-wider">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setCurrentView('store')} className="mt-6 text-xs text-emerald-600 font-black uppercase tracking-wider hover:underline block text-center mx-auto">← Back to grocery aisles</button>
          </div>
        )}

        {/* REST OF YOUR LAYOUT CODE MODULES */}
        {currentView === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Lock className="text-emerald-600" /> Account Sign In</h2>
            {authSuccess && <p className="mb-4 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded-lg">{authSuccess}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label><input type="text" required value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
              <div>
                <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
                  <button type="button" onClick={() => setCurrentView('forgot_pass')} className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Forgot Password?</button>
                </div>
                <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              {authError && <p className="text-red-500 text-xs font-semibold">{authError}</p>}
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">Login</button>
            </form>
          </div>
        )}

        {currentView === 'forgot_pass' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2"><KeyRound className="text-emerald-600" /> Reset Password Request</h2>
            {resetMessage && <p className="mb-4 text-emerald-700 text-xs font-bold bg-emerald-50 p-3 rounded-xl">{resetMessage}</p>}
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registered Username</label><input type="text" required value={resetUsername} onChange={e => setResetUsername(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desired New Password</label><input type="password" required value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" /></div>
              <div className="flex gap-2"><button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm">Send Ticket</button><button type="button" onClick={() => setCurrentView('login')} className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Cancel</button></div>
            </form>
          </div>
        )}

        {currentView === 'signup' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><UserPlus className="text-emerald-600" /> Register Customer Profile</h2>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label><input type="text" required value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Phone Number</label><input type="tel" required value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="9876543210" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Secure Password</label><input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">Create Account</button>
            </form>
          </div>
        )}

        {currentView === 'payment' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="text-emerald-600" /> SmartMart Payment Gateway</h2>
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="bg-emerald-50/50 p-4 rounded-xl space-y-2">
                <input type="text" placeholder="Full Billing Name" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-4 py-2 bg-white border rounded-lg text-sm" />
                <input type="email" placeholder="Email Address" required value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full px-4 py-2 bg-white border rounded-lg text-sm" />
                <input type="tel" placeholder="Phone Number (Required)" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full px-4 py-2 bg-white border rounded-lg text-sm" />
              </div>
              <input type="text" placeholder="Card Number" required maxLength="16" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl">Authorize Secure Payment (₹{cart.reduce((s,i)=>s+(i.price*i.qty),0).toFixed(2)})</button>
            </form>
          </div>
        )}

        {currentView === 'receipt' && finalInvoice && (
          <div className="max-w-lg mx-auto bg-white border-2 border-dashed border-gray-200 p-8 rounded-2xl shadow-lg text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="w-6 h-6" /></div>
            <h2 className="text-xl font-black text-gray-900">SmartMart Supermarket</h2>
            <div className="text-left my-4 text-xs space-y-1 bg-gray-50 p-4 rounded-xl">
              <div>Invoice ID: #SM-{finalInvoice.orderId}</div>
              <div>Customer Name: {finalInvoice.name}</div>
              <div>Contact Phone: {finalInvoice.phone}</div>
              <div className="font-bold text-emerald-600 mt-2 text-sm">Paid Amount: ₹{finalInvoice.total.toFixed(2)}</div>
            </div>
            <button onClick={() => window.print()} className="w-full py-2 bg-gray-950 text-white rounded-xl font-bold text-sm mb-2">Print Bill Copy</button>
            <button onClick={() => setCurrentView('store')} className="text-xs font-bold text-gray-400">Return to Storefront</button>
          </div>
        )}

        {currentView === 'store' && (
          user && user.role === 'admin' ? (
            /* ACTIVE ADMINISTRATIVE DASHBOARD DESK CONTEXT */
            <div className="space-y-10">
              
              {/* FEATURE 1: VISUAL ANALYTICS INFRASTRUCTURE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Store Gross Earnings</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1 flex items-center"><IndianRupee className="w-5 h-5 inline" />{analytics.total_revenue.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><IndianRupee className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customer Transactions</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{analytics.total_orders} Orders</h3>
                  </div>
                  <div className="p-3 bg-gray-50 text-gray-600 rounded-xl"><Receipt className="w-6 h-6" /></div>
                </div>
              </div>

              {/* FEATURE 4: ADMIN DELIVERY TRACKING DESK CONTROL BOARD */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2"><Truck className="text-emerald-600 w-5 h-5" /> Live Order Delivery Tracking Logs</h2>
                {adminOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 font-semibold">No orders recorded in database yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold">
                          <th className="py-3 px-2">Order ID</th>
                          <th className="py-3 px-2">Customer Details</th>
                          <th className="py-3 px-2">Total Amount</th>
                          <th className="py-3 px-2">Current Status</th>
                          <th className="py-3 px-2 text-right">Modify Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                        {adminOrders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-2 font-bold text-gray-900">#SM-{order.id}</td>
                            <td className="py-3 px-2">
                              <div className="font-bold text-gray-900">{order.customer_name}</div>
                              <div className="text-gray-400 text-[10px]">{order.customer_phone} | {order.customer_email}</div>
                            </td>
                            <td className="py-3 px-2 font-black text-emerald-600">₹{order.total_amount.toFixed(2)}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${order.status === 'Paid' ? 'bg-blue-50 text-blue-700' : order.status === 'Out for Delivery' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{order.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <select 
                                value={order.status}
                                onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 focus:outline-none"
                              >
                                <option value="Paid">Paid</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECURITY TICKETS LOGS */}
              <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm bg-gradient-to-br from-white to-red-50/20">
                <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500 w-5 h-5" /> Pending Password Reset Requests ({resetRequestsList.length})</h2>
                {resetRequestsList.length === 0 ? <p className="text-xs text-gray-400 font-semibold">No pending requests.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resetRequestsList.map(req => (
                      <div key={req.id} className="p-4 bg-white border rounded-xl text-xs space-y-2">
                        <div>Subject: <b>{req.username}</b></div>
                        <div className="flex gap-2"><button onClick={() => handleAdminResetAction(req.id, 'Approve')} className="flex-1 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]">Approve</button><button onClick={() => handleAdminResetAction(req.id, 'Reject')} className="flex-1 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg text-[10px]">Deny</button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2"><Users className="text-emerald-600 w-5 h-5" /> Registered Profiles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers.map(u => <div key={u.id} className="p-4 bg-gray-50 rounded-xl text-xs"><b>{u.username}</b> - {u.phone_number}</div>)}
                </div>
              </div>

              {/* ADMIN PRODUCT CREATOR FORM */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <PlusCircle className="text-emerald-600" /> Append New Inventory Item
                </h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Item Name" required value={newProdName} onChange={e => setNewProdName(e.target.value)} className="px-4 py-2 bg-gray-50 border rounded-xl text-sm" />
                  <input type="number" placeholder="Price (₹)" required value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} className="px-4 py-2 bg-gray-50 border rounded-xl text-sm" />
                  <input type="number" placeholder="Initial Stock Qty" required value={newProdStock} onChange={e => setNewProdStock(e.target.value)} className="px-4 py-2 bg-gray-50 border rounded-xl text-sm" />
                  <select value={newProdCat} onChange={e => setNewProdCat(e.target.value)} className="px-4 py-2 bg-gray-50 border rounded-xl text-sm">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="text" placeholder="Paste Image URL Link" value={newProdImage} onChange={e => setNewProdImage(e.target.value)} className="md:col-span-4 px-4 py-2 bg-gray-50 border rounded-xl text-sm font-mono text-xs text-emerald-700" />
                  <input type="text" placeholder="Description Context" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} className="md:col-span-4 px-4 py-2 bg-gray-50 border rounded-xl text-sm" />
                  <button type="submit" className="md:col-span-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm">Save to Database</button>
                </form>
              </div>

              {/* ACTIVE ADMIN INVENTORY MANAGEMENT CARDS */}
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Active Inventory</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-opacity ${p.stock_quantity <= 0 ? 'border-red-200 bg-red-50/10' : ''}`}>
                      {editingProductId === p.id ? (
                        <div className="space-y-2">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1 text-xs border rounded font-bold" />
                          <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-2 py-1 text-xs border rounded text-emerald-600 font-bold" />
                          <input type="number" placeholder="Stock Quantity" value={editStock} onChange={e => setEditStock(e.target.value)} className="w-full px-2 py-1 text-xs border rounded font-bold" />
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-2 py-1 text-xs border rounded" />
                          <div className="flex gap-2">
                            <button onClick={() => saveProductEdits(p)} className="flex-1 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">Save</button>
                            <button onClick={() => setEditingProductId(null)} className="flex-1 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full justify-between relative">
                          {p.stock_quantity <= 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">OUT OF STOCK</span>}
                          <div className="flex gap-4">
                            <img src={p.image_url} alt="" className={`w-12 h-12 rounded-xl object-cover border ${p.stock_quantity <= 0 ? 'grayscale opacity-40' : ''}`} />
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                              <div className="text-xs font-semibold text-gray-400 mt-0.5">Stock Level: <b className={p.stock_quantity <= 0 ? 'text-red-500 font-bold' : 'text-gray-700'}>{p.stock_quantity}</b></div>
                              <div className="text-sm font-black text-emerald-600 mt-1">₹{p.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => { setEditingProductId(p.id); setEditName(p.name); setEditPrice(p.price); setEditStock(p.stock_quantity); setEditDesc(p.description || ''); }} className="flex-1 py-1.5 bg-gray-50 text-gray-700 hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1"><Edit3 className="w-3 h-3"/> Edit Row</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TRADITIONAL CUSTOMER STORE AISLES */
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="w-full lg:w-64 shrink-0">
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto">
                  <button onClick={() => setSelectedCategory(null)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${selectedCategory === null ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border'}`}><ShoppingBag className="w-4 h-4" /> All Departments</button>
                  {categories.map(c => <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${selectedCategory === c.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border'}`}>{IconMap[c.icon_name] || <ShoppingBag className="w-4 h-4" />} {c.name}</button>)}
                </div>
              </aside>
              
              <section className="flex-1">
                {/* FEATURE 2: DISPLAYS INLINE WARNING NOTICE IF NOTHING IS MATCHED */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border text-center font-semibold text-gray-400 text-sm">
                    No active grocery matches found for "{searchQuery}". Try another name!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-opacity ${p.stock_quantity <= 0 ? 'opacity-60' : ''}`}>
                        <div className="h-44 bg-gray-100 relative">
                          <img src={p.image_url} alt="" className={`w-full h-full object-cover ${p.stock_quantity <= 0 ? 'grayscale' : ''}`} />
                          {p.stock_quantity <= 0 && (
                            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-lg tracking-wider shadow-md">OUT OF STOCK</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col flex-1 justify-between">
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{p.name}</h3>
                          <div className="flex items-center justify-between pt-3 border-t mt-4">
                            <span className="text-base font-black text-gray-900">₹{p.price.toFixed(2)}</span>
                            <button 
                              disabled={p.stock_quantity <= 0}
                              onClick={() => addToCart(p)} 
                              className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${p.stock_quantity <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
                            >
                              {p.stock_quantity <= 0 ? 'Sold Out' : 'Add to Basket'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        )}
      </main>

      {/* FEATURE 3: SIDEBAR DRAWER COMPLETE WITH QUANTITY PLUS / MINUS TOGGLES */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b mb-4"><h3 className="font-bold text-gray-900 text-base">Shopping Basket Drawer</h3><button onClick={() => setIsCartOpen(false)} className="text-xs text-gray-400 font-bold">Close</button></div>
              <div className="space-y-3 overflow-y-auto max-h-[60vh]">
                {cart.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">Basket empty.</p> : cart.map(i => (
                  <div key={i.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
                    <div>
                      <span className="font-bold text-xs text-gray-800 block">{i.name}</span>
                      <span className="text-[10px] text-emerald-600 font-black">₹{i.price.toFixed(2)} each</span>
                    </div>
                    {/* QUANTITY CONTROL BAR BUNDLE */}
                    <div className="flex items-center gap-2 bg-white px-2 py-1 border rounded-lg shadow-xs">
                      <button onClick={() => updateCartQty(i.id, -1)} className="p-1 hover:text-red-500 transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-black text-gray-900 px-1">{i.qty}</span>
                      <button onClick={() => updateCartQty(i.id, 1)} className="p-1 hover:text-emerald-600 transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center font-bold text-sm text-gray-500"><span>Basket Total:</span><span className="text-xl font-black text-gray-900">₹{cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2)}</span></div>
                <button onClick={startCheckout} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">Proceed to Checkout <ArrowRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}