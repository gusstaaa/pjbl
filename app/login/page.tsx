'use client';

import { Navbar } from '@/components/Navbar';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <LoginForm modoPaginaPrincipal={false} />
    </div>
  );
}
