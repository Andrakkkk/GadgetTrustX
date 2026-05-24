'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-32 p-4">
      <div className="text-slate-400 text-center">Redirecting to login...</div>
    </div>
  );
}
