import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

// Use relative URL to leverage Vite proxy
const API_BASE_URL = '';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const userData = {
          userId: response.data.data.user.userId,
          email: response.data.data.user.email,
          fullName: response.data.data.user.fullName,
          role: response.data.data.user.role
        };
        console.log('Logging in user:', userData);
        login(response.data.data.token, userData);
        navigate('/', { replace: true });
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Professional Government Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
      
      {/* Geometric Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-white space-y-6 hidden md:block pr-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl shadow-2xl mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-indigo-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
              <span className="material-symbols-outlined text-white text-5xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                admin_panel_settings
              </span>
            </div>
            
            <h1 className="text-5xl font-black leading-tight">
              WinGuard
              <br />
              <span className="text-blue-300">Official Portal</span>
            </h1>
            
            <p className="text-lg text-blue-100 font-medium leading-relaxed max-w-md">
              Secure access to city safety management dashboard. Monitor, analyze, and respond to citizen reports in real-time.
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-200 text-xl">verified</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">Secure Authentication</h3>
                  <p className="text-sm text-blue-200">End-to-end encrypted</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-indigo-200 text-xl">analytics</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">Real-time Analytics</h3>
                  <p className="text-sm text-blue-200">Live data and insights</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-purple-200 text-xl">shield</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">City Safety Management</h3>
                  <p className="text-sm text-blue-200">Comprehensive control</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            {/* Mobile Logo */}
            <div className="md:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl shadow-2xl mb-4">
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">WinGuard</h1>
              <p className="text-blue-200 font-semibold">Official Portal</p>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/50">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-sm text-gray-600 font-semibold">Sign in to access the dashboard</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm">error</span>
                  </div>
                  <p className="text-xs text-red-800 font-semibold">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-base">badge</span>
                    Official Email
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-semibold text-sm text-gray-800 bg-white"
                      placeholder="official@bengaluru.gov.in"
                      required
                      autoComplete="email"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-blue-600 transition-colors text-base">
                      mail
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-base">lock</span>
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-semibold text-sm text-gray-800 bg-white"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-indigo-600 transition-colors text-base">
                      lock
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 font-semibold group-hover:text-gray-900">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-base shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">login</span>
                      Sign In to Dashboard
                    </span>
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5">info</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 mb-2">Demo Credentials</p>
                    <p className="text-xs text-gray-700 font-mono bg-white px-2 py-1.5 rounded mb-1 break-all">
                      📧 official@bengaluru.gov.in
                    </p>
                    <p className="text-xs text-gray-700 font-mono bg-white px-2 py-1.5 rounded break-all">
                      🔒 official123
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-green-600">verified</span>
                  <span className="font-semibold">Secure</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-blue-600">encrypted</span>
                  <span className="font-semibold">Encrypted</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-purple-600">shield</span>
                  <span className="font-semibold">Protected</span>
                </span>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-blue-200 mt-4 font-medium">
              © 2026 WinGuard. Government of Karnataka.
            </p>
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
