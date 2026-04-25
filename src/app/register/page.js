'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('buyer');
  const [name, setName] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !name) return;
    
    // In a real app, we would create a user here.
    // Since we mock it, we just log them in.
    login(role, email);
    
    if (role === 'admin') router.push('/admin');
    else if (role === 'seller') router.push('/seller-profile');
    else router.push('/buyer-profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-600">Join GadgetTrustX</h1>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">I want to join as a:</label>
            <select 
              className="input-field appearance-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="buyer">Buyer (Buying & Trading in)</option>
              <option value="seller">Seller (Listing Devices)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full mt-2">
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <p>Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
