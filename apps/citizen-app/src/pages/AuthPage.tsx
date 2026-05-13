import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!fullName) {
          setError('Full name is required');
          setIsLoading(false);
          return;
        }
        await register(email, password, fullName, phone);
      }
      navigate('/map');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark Background with Cyan-Green and Orange */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-orange-900"></div>
      
      {/* Geometric Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Floating Road Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 opacity-10 animate-float">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M10 50 Q 30 30 50 50 T 90 50" stroke="#14b8a6" strokeWidth="8" fill="none" strokeDasharray="5,5"/>
        </svg>
      </div>
      <div className="absolute bottom-20 right-10 w-40 h-40 opacity-10 animate-float-delayed">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="30" fill="#f97316"/>
          <circle cx="50" cy="50" r="15" fill="white"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-6 transform hover:scale-105 transition-transform relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-orange-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <img 
                src="/WinGuard_Logo.png" 
                alt="WinGuard Logo" 
                className="h-24 w-auto drop-shadow-2xl relative z-10"
              />
            </div>
            <h1 className="text-5xl font-black mb-3 tracking-tight font-display">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">Win</span>
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Guard</span>
            </h1>
            <p className="text-cyan-100 font-semibold text-lg">
              {isLogin ? '🛡️ Welcome back, Guardian!' : '🚀 Join the Safety Revolution'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-cyan-200 font-medium">Bengaluru Safe Routes Active</span>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/50 relative overflow-hidden animate-slide-up">
            {/* Decorative Road Element */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0 20 Q 25 10 50 20 T 100 20" stroke="#0891b2" strokeWidth="15" fill="none" strokeDasharray="8,4"/>
                <path d="M0 50 Q 25 40 50 50 T 100 50" stroke="#f97316" strokeWidth="15" fill="none" strokeDasharray="8,4"/>
              </svg>
            </div>

            {/* Toggle Tabs */}
            <div className="flex gap-2 mb-8 bg-gradient-to-r from-gray-100 to-gray-50 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden ${
                  isLogin
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {isLogin && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-500 opacity-50 blur-xl"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </span>
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden ${
                  !isLogin
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {!isLogin && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-50 blur-xl"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Sign Up
                </span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 animate-shake shadow-lg">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">error</span>
                </div>
                <p className="text-sm text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600 text-lg">badge</span>
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="relative w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none font-semibold text-gray-800 bg-white/80"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-orange-600 transition-colors">
                      person
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-600 text-lg">mail</span>
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none font-semibold text-gray-800 bg-white/80"
                    placeholder="your.email@example.com"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-cyan-600 transition-colors">
                    email
                  </span>
                </div>
              </div>

              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-lg">call</span>
                    Phone Number <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="relative w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none font-semibold text-gray-800 bg-white/80"
                      placeholder="+91 98765 43210"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-green-600 transition-colors">
                      phone
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600 text-lg">lock</span>
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity"></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all outline-none font-semibold text-gray-800 bg-white/80"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-teal-600 transition-colors">
                    lock
                  </span>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 font-semibold group-hover:text-gray-900">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-bold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 rounded-2xl font-bold text-white text-lg shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                  isLogin
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600'
                    : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLogin ? (
                      <>
                        <span className="material-symbols-outlined">login</span>
                        Sign In to WinGuard
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">rocket_launch</span>
                        Create Account
                      </>
                    )}
                  </span>
                )}
              </button>
            </form>

            {/* Features for Sign Up */}
            {!isLogin && (
              <div className="mt-8 pt-6 border-t-2 border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-4 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">star</span>
                  What You'll Get
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-xl border border-green-200">
                    <span className="material-symbols-outlined text-green-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-gray-700 font-bold">Report Issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                    <span className="material-symbols-outlined text-cyan-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-gray-700 font-bold">Safe Routes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-orange-50 p-3 rounded-xl border border-orange-200">
                    <span className="material-symbols-outlined text-orange-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-gray-700 font-bold">Live Alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <span className="material-symbols-outlined text-purple-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-gray-700 font-bold">AI Assistant</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600 font-medium">
              By continuing, you agree to our{' '}
              <a href="#" className="text-cyan-600 font-bold hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-cyan-600 font-bold hover:underline">Privacy Policy</a>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-green-600">verified</span>
                Secure
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-cyan-600">encrypted</span>
                Encrypted
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-orange-600">shield</span>
                Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
