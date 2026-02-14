
import React, { useState } from 'react';
import { login, register, loginAsGuest } from '../services/auth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!identifier || !password) {
        setError('ERR_NULL_INPUT: Credentials required.');
        setLoading(false);
        return;
    }

    // Simulate network delay for sci-fi effect
    setTimeout(() => {
      let success = false;
      if (isRegistering) {
        success = register(identifier, password);
        if (!success) setError('ERR_DUPLICATE: User entity already exists.');
      } else {
        success = login(identifier, password);
        if (!success) setError('ACCESS DENIED: Invalid Credentials');
      }

      if (success) {
        onLogin();
      } else {
        setLoading(false);
      }
    }, 800);
  };

  const handleGuestAccess = () => {
    setLoading(true);
    setTimeout(() => {
        loginAsGuest();
        onLogin();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020202] text-[#e0e0e0] font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,204,0,0.05)_0%,transparent_70%)]"></div>
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-10 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden group">
        
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffcc00] to-transparent opacity-50"></div>
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full border border-[#ffcc00]/20 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 rounded-full border border-[#ffcc00]/10 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border border-dashed border-[#ffcc00]/30 animate-[spin_5s_linear_infinite_reverse]"></div>
                <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-bold tracking-[0.3em] text-white uppercase font-mono">FRIDAY <span className="text-[#ffcc00]">OS</span></h1>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.5em] mt-2">Secure Access Terminal</p>
        </div>

        {/* Auth Tabs */}
        <div className="flex mb-6 border-b border-white/10">
            <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-widest transition-colors ${!isRegistering ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' : 'text-white/30 hover:text-white'}`}
            >
                Login
            </button>
            <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-widest transition-colors ${isRegistering ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' : 'text-white/30 hover:text-white'}`}
            >
                Register
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#ffcc00] uppercase tracking-widest ml-1">
                    {isRegistering ? 'Email or Phone Number' : 'Identity Key'}
                </label>
                <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono placeholder-white/20 focus:outline-none focus:border-[#ffcc00]/50 focus:bg-white/10 transition-all"
                    placeholder={isRegistering ? "user@example.com" : "Enter credentials"}
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#ffcc00] uppercase tracking-widest ml-1">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono placeholder-white/20 focus:outline-none focus:border-[#ffcc00]/50 focus:bg-white/10 transition-all"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <div className="text-red-400 text-[10px] font-bold font-mono tracking-widest text-center bg-red-950/30 py-2 border border-red-500/20 rounded animate-pulse">
                    {error}
                </div>
            )}

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#ffcc00] text-black font-bold py-3.5 rounded-lg uppercase tracking-[0.2em] text-xs hover:bg-[#ffeebb] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group/btn"
                >
                    <span className="relative z-10">
                        {loading ? 'PROCESSING...' : isRegistering ? 'CREATE IDENTITY' : 'ESTABLISH LINK'}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
            <div className="w-full h-px bg-white/5"></div>
            <button 
                onClick={handleGuestAccess}
                disabled={loading}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
            >
                [ Initiate Guest Protocol ]
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
