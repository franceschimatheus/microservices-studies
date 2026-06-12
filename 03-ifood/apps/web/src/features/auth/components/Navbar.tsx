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
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(role === 'admin' ? '/admin' : '/customer')}>
          <span className="text-2xl font-black text-red-600 tracking-tighter">iFood</span>
          {role && (
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider">
              {role}
            </span>
          )}
        </div>
        {role === 'customer' && (
          <nav className="flex gap-4 items-center">
            <button
              onClick={() => router.push('/customer')}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
            >
              Browse
            </button>
            <button
              onClick={() => router.push('/customer/profile')}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
            >
              My Orders
            </button>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        {email && (
          <button
            onClick={() => router.push('/customer/profile')}
            className="flex items-center gap-3 hover:bg-slate-900 px-3 py-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800"
            title="Go to Profile"
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email}&backgroundColor=transparent`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-slate-300 text-sm font-semibold hidden sm:block">{email}</span>
          </button>
        )}
        <button
          onClick={handleSignout}
          className="border border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
