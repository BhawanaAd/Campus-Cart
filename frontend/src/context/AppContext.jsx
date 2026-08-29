import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Use sessionStorage so each browser tab can have an independent session
  const [authToken, setAuthToken] = useState(sessionStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState(
    sessionStorage.getItem('currentUser') ? JSON.parse(sessionStorage.getItem('currentUser')) : null
  );
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Internal view state (raw setter, does NOT touch browser history)
  const [currentView, setCurrentViewState] = useState('login');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [cartOpen, setCartOpen] = useState(false);
  const setCurrentView = (view) => {
    setCurrentViewState(view);
    window.history.pushState({ view }, '', window.location.pathname);
  };
  useEffect(() => {
    window.history.replaceState({ view: currentView }, '', window.location.pathname);

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentViewState(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);

  }, []);

  useEffect(() => {
    if (authToken && currentUser) {
      setCurrentView(currentUser.user_type === 'student' ? 'outlets' : 'vendor-dashboard');
    }
  }, [authToken, currentUser]);

  useEffect(() => {
    try {
      sessionStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to sessionStorage', e);
    }
  }, [cart]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const apiCall = async (endpoint, options = {}) => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://campus-cart-backend-23np.onrender.com/api');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      setAuthToken(data.token);
      setCurrentUser(data.user);
      // Store token and user in sessionStorage so each tab can be independent
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));
      
      showNotification(`Welcome ${data.user.full_name}!`, 'success');
      // Route users to appropriate view based on role
      if (data.user.user_type === 'student') {
        setCurrentView('outlets');
      } else if (data.user.user_type === 'vendor') {
        setCurrentView('vendor-dashboard');
      } else if (['support_agent', 'senior_support', 'admin'].includes(data.user.user_type)) {
        setCurrentView('support');
      } else {
        setCurrentView('outlets');
      }
    } catch (error) {
      showNotification(error.message || 'Login failed', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      setAuthToken(data.token);
      setCurrentUser(data.user);
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));
      
      showNotification(`Account created successfully! Welcome ${data.user.full_name}`, 'success');
      if (data.user.user_type === 'student') {
        setCurrentView('outlets');
      } else if (data.user.user_type === 'vendor') {
        setCurrentView('vendor-dashboard');
      } else {
        setCurrentView('outlets');
      }
    } catch (error) {
      showNotification(error.message || 'Signup failed', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Revoke current session on server (best-effort)
    const revoke = async () => {
      try {
        if (authToken) {
          await apiCall('/auth/logout', { method: 'POST' });
        }
      } catch (e) {
        // ignore errors during logout
      }
    };

    revoke();

    setAuthToken(null);
    setCurrentUser(null);
    setCart([]);
    setSelectedOutlet(null);
    setSelectedStore(null);
    setCartOpen(false);
    // Only clear sessionStorage keys related to this tab
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('cart');
    setCurrentView('login');
    showNotification('Logged out successfully', 'info');
  };

  // List sessions for current user (calls backend)
  const listSessions = async () => {
    try {
      const data = await apiCall('/auth/sessions', { method: 'GET' });
      return data.sessions;
    } catch (error) {
      console.error('Failed to list sessions', error);
      throw error;
    }
  };

  // Revoke a specific session by sessionId
  const revokeSession = async (sessionId) => {
    try {
      await apiCall(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Failed to revoke session', error);
      throw error;
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const value = {
    authToken,
    currentUser,
    cart,
    setCart,
    clearCart,
    cartOpen,
    setCartOpen,
    currentView,
    setCurrentView,
    selectedOutlet,
    setSelectedOutlet,
    selectedStore,
    setSelectedStore,
    loading,
    setLoading,
    notification,
    showNotification,
    apiCall,
    login,
    signup,
    logout,
    listSessions,
    revokeSession
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;