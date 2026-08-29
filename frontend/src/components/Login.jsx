import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Lock, Phone, Store, MapPin, Tag, FileText, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, signup, showNotification } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [userType, setUserType] = useState('student'); // 'student' | 'vendor'
  const [isLoading, setIsLoading] = useState(false);

  // Common Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vendor Extra Fields for Sign Up
  const [restaurantName, setRestaurantName] = useState('');
  const [outletType, setOutletType] = useState('food'); // 'food' | 'grocery' | 'stationary'
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validation
        if (password !== confirmPassword) {
          showNotification('Passwords do not match', 'error');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          showNotification('Password must be at least 6 characters long', 'error');
          setIsLoading(false);
          return;
        }

        const signupData = {
          email,
          password,
          full_name: fullName,
          phone,
          user_type: userType,
          ...(userType === 'vendor' && {
            restaurant_name: restaurantName,
            outlet_type: outletType,
            location,
            description
          })
        };

        await signup(signupData);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transition-all duration-300">
        
        {/* App Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 text-red-600 rounded-full mb-3 shadow-inner">
            <Store size={28} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">CampusCart</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Food • Grocery • Stationary Delivery</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !isSignUp ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isSignUp ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* User Type Switcher: Student vs Vendor */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              userType === 'student'
                ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>👨‍🎓</span> Student
          </button>
          <button
            type="button"
            onClick={() => setUserType('vendor')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              userType === 'vendor'
                ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🏪</span> Vendor
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Extra Fields for Sign Up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder={userType === 'vendor' ? 'Owner / Manager Name' : 'Rahul Singh'}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder={userType === 'vendor' ? 'vendor@gmail.com' : 'student@gmail.com'}
                required
              />
            </div>
          </div>

          {/* Phone Number (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="9876543210"
                />
              </div>
            </div>
          )}

          {/* Vendor Specific Store Setup Fields for Sign Up */}
          {isSignUp && userType === 'vendor' && (
            <div className="border-t border-b border-orange-100 py-3 my-2 space-y-3 bg-orange-50/50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-red-700 font-bold text-sm mb-1">
                <Store size={16} />
                <span>Store / Outlet Details</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Store / Outlet Name *</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    placeholder="e.g. Royal Taste Cafe"
                    required={isSignUp && userType === 'vendor'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outlet Type *</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-2.5 top-3 text-gray-400" />
                    <select
                      value={outletType}
                      onChange={(e) => setOutletType(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                    >
                      <option value="food">🍽️ Food Outlet</option>
                      <option value="grocery">🛒 Grocery Store</option>
                      <option value="stationary">📚 Stationary Shop</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-2.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. Food Court Gate 2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-2.5 top-3 text-gray-400" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                    placeholder="Short description of items, snacks, or specialties..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required={isSignUp}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-200 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
          >
            {isLoading
              ? (isSignUp ? 'Creating Account...' : 'Logging in...')
              : (isSignUp ? `Create ${userType === 'vendor' ? 'Vendor' : 'Student'} Account` : 'Sign In')}
          </button>
        </form>

        {/* Bottom Switch Link */}
        <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-red-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-red-600 font-bold hover:underline"
              >
                Create Account (Sign Up)
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}