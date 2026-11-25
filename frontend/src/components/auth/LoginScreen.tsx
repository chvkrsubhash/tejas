import React, { useState } from 'react';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { usePresentationStore } from '../../store/usePresentationStore';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, registerWithCredentials, continueOffline } = usePresentationStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithCredentials(email, password);
      } else {
        await registerWithCredentials(name, email, password);
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#DADCE0] rounded-md shadow-sm p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={brandConfig.logoPath}
            alt={brandConfig.productName}
            className="w-12 h-12 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-[#242424]">{brandConfig.productName}</h1>
          <p className="text-xs text-[#616161] mt-0.5">{brandConfig.tagline}</p>
        </div>

        {/* Mode Switch */}
        <div className="flex border-b border-[#DADCE0] text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 border-b-2 ${
              mode === 'login' ? 'border-[#C4512D] text-[#C4512D]' : 'border-transparent text-[#616161]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 border-b-2 ${
              mode === 'register' ? 'border-[#C4512D] text-[#C4512D]' : 'border-transparent text-[#616161]'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-medium text-[#242424] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#616161] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-9 pl-8 pr-3 border border-[#DADCE0] rounded outline-none focus:border-[#C4512D]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-[#242424] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#616161] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@akashavyom.com"
                className="w-full h-9 pl-8 pr-3 border border-[#DADCE0] rounded outline-none focus:border-[#C4512D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#242424] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#616161] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full h-9 pl-8 pr-3 border border-[#DADCE0] rounded outline-none focus:border-[#C4512D]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-[#C4512D] hover:bg-[#A94222] text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-[#ECEEF1] text-center">
          <button
            type="button"
            onClick={continueOffline}
            className="text-xs text-[#616161] hover:text-[#C4512D] font-medium"
          >
            Continue Offline (Local IndexedDB Workspace)
          </button>
        </div>
      </div>
    </div>
  );
};

