import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldCheck, KeyRound, Lock, User, Phone, Loader2, ShieldAlert } from 'lucide-react';

export const MasterSetupModal: React.FC = () => {
  const { isMasterSetupOpen, setIsMasterSetupOpen, initMaster, masterEmail } = useAuth();
  const [name, setName] = useState('Alifer Madeiro');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('11973479473');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isMasterSetupOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha do Master Owner deve ter pelo menos 8 caracteres para proteção dos privilégios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await initMaster(password, name, phone);
      setSuccess(true);
      setTimeout(() => {
        setIsMasterSetupOpen(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao inicializar Master Owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA]">
        <button
          onClick={() => setIsMasterSetupOpen(false)}
          className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40 rounded-full font-mono">
                Privilégio Máximo
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F5F3FA] mt-0.5">Credenciais do Master Owner</h2>
            <p className="text-xs text-[#AAA6B5]">Ativação e redefinição de acesso do titular master permanente</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-[#25222D] border border-[#393442] rounded-xl text-xs space-y-1">
          <p className="text-[#F5F3FA] font-medium">
            E-mail autorizado exclusivo: <span className="text-[#C4B5FD] font-mono font-bold">{masterEmail}</span>
          </p>
          <p className="text-[#AAA6B5] text-[11px] leading-relaxed">
            O Master Owner possui acesso permanente e irrestrito a todos os módulos, dados consolidados de empresas,
            gestão de planos e aprovações financeiras sem expiração. Defina sua senha segura abaixo.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[#A7F3D0] text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B981]" />
            <span>Master Owner configurado e autenticado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome do Titular Master</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alifer Madeiro"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1">WhatsApp / Telefone de Contato</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 97347-9473"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Senha Master (mín. 8 caracteres)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
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

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Salvar & Autenticar como Master Owner</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
