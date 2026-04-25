'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (isRegister && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    
    let result;
    if (isRegister) {
      result = register(role, email, password, name);
    } else {
      result = login(role, email, password);
    }

    if (!result.success) {
      setError(result.message);
      return;
    }
    
    if (role === 'admin') router.push('/admin');
    else if (role === 'seller') router.push('/seller-profile');
    else router.push('/buyer-profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">GadgetTrustX</h1>
          <p className="text-slate-400 mt-2">{isRegister ? 'Create a new account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Role (Simulation)</label>
            <select 
              className="input-field appearance-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full">
            {isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setError(''); }} 
            className="text-blue-400 hover:text-blue-300 underline font-semibold mb-4 block w-full"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
          <p>This is a simulated login for testing the platform roles.</p>
        </div>
      </div>
    </div>
  );
}
