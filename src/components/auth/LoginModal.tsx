import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, ShieldAlert, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, masterEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const isMasterAttempt = email.trim().toLowerCase() === masterEmail.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA]">
        <button
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F3FA]">Acessar Plataforma</h2>
            <p className="text-xs text-[#AAA6B5]">Insira suas credenciais da empresa ou Master Owner</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>
            {isMasterAttempt && (
              <p className="text-[11px] text-[#C4B5FD] mt-1.5 font-medium flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>E-mail identificado como Administrador Master Owner autorizado</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
