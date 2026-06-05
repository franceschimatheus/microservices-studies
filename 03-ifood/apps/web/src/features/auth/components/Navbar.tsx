import React from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  email?: string;
  role?: string;
  onLogout: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({ email, role, onLogout }) => {
  const router = useRouter();

  const handleSignout = async () => {
    await onLogout();
    router.push('/login');
  };

  return (
    <header className="flex justify-between items-center px-10 py-5 bg-slate-950 border-b border-slate-900">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-red-600 tracking-tighter">iFood</span>
        {role && (
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider">
            {role}
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <span className="text-slate-400 text-sm font-medium">{email}</span>
        <button
          onClick={handleSignout}
          className="border border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
