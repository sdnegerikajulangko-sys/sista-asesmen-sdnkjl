import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Lock, User, Target, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Kredensial: Username: SistaAdmin / Sista, Password: ...
    setTimeout(() => {
      if ((username === 'Admin' || username === 'Sista') && password === 'sdnkjl1*') {
        onLogin();
      } else {
        setError('Username atau password salah.');
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-50">
      {/* Background Decor - Menggunakan Biru & Hijau Soft */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-200/40 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-200/30 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(15,76,129,0.1)]">
          <div className="flex flex-col items-center mb-10">
            {/* Logo Container dengan Gradient Biru-Hijau */}
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-xl mb-4 overflow-hidden group">
              <div className="w-full h-full rounded-[1.9rem] bg-white overflow-hidden flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="SistaApp" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }
                  }} 
                />
                <Target className="text-blue-600 w-10 h-10 fallback-icon hidden" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Sista</h1>
            <div className="flex items-center justify-center flex-wrap gap-2 text-center px-4">
              <div className="h-px w-4 bg-amber-400 shrink-0" /> {/* Aksen Emas */}
              <p className="text-blue-800 font-bold tracking-tight text-center leading-snug">Sistem Asesmen Pintar</p>
              <div className="h-px w-4 bg-amber-400 shrink-0" />
            </div>
            <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">GENERATOR AI</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-900 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-900 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center border border-red-100"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-2">
            <div className="h-1 w-10 bg-slate-100 rounded-full" />
            <p className="text-center text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
              Designed BY <span className="text-blue-600">FIDHAL TOUNA</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
