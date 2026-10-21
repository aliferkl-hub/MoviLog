import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const RegisterModal: React.FC = () => {
  const { isRegisterModalOpen, setIsRegisterModalOpen, registerCompany, selectedPlanForCheckout } = useAuth();

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    responsavel: '',
    email: '',
    telefone: '',
    endereco: '',
    tipoOperacao: 'integrada' as 'logistica' | 'predial' | 'integrada' | 'expedicao',
    modulos: ['logistica', 'predial'] as ('logistica' | 'predial')[],
    adminPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isRegisterModalOpen) return null;

  const handleModuleToggle = (mod: 'logistica' | 'predial') => {
    if (formData.modulos.includes(mod)) {
      if (formData.modulos.length === 1) return; // at least one module
      setFormData({ ...formData, modulos: formData.modulos.filter(m => m !== mod) });
    } else {
      setFormData({ ...formData, modulos: [...formData.modulos, mod] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.adminPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await registerCompany({
        ...formData,
        planoId: selectedPlanForCheckout || 'plan_demo'
      });
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1D1B24] border border-[#393442] rounded-2xl p-6 shadow-2xl text-[#F5F3FA] my-8">
        <button
          onClick={() => setIsRegisterModalOpen(false)}
          className="absolute top-4 right-4 text-[#AAA6B5] hover:text-[#F5F3FA] p-1 rounded-lg hover:bg-[#25222D] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F3FA]">Cadastro Empresarial & Demonstração</h2>
            <p className="text-xs text-[#AAA6B5]">Crie o ambiente exclusivo e seguro para sua empresa</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome Fantasia *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.nomeFantasia}
                  onChange={e => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  placeholder="Ex: TransLog Express / Condomínio Solar"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                placeholder="Ex: TransLog Transportes e Logística Ltda"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">CNPJ (quando aplicável)</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full bg-[#25222D] border border-[#393442] rounded-xl px-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Responsável Administrativo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.responsavel}
                  onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">E-mail Profissional *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@suaempresa.com"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Telefone / WhatsApp *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Endereço / Sede</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade/UF"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Tipo de Operação</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <select
                  value={formData.tipoOperacao}
                  onChange={e => setFormData({ ...formData, tipoOperacao: e.target.value as any })}
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="integrada">Operação Integrada (Logística + Predial)</option>
                  <option value="logistica">Centro de Distribuição / Depósito / Galpão</option>
                  <option value="expedicao">Empresa de Expedição / Transportadora</option>
                  <option value="predial">Condomínio Residencial / Edifício Comercial</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1.5">Módulos Desejados</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModuleToggle('logistica')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  formData.modulos.includes('logistica')
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F5F3FA]'
                    : 'border-[#393442] bg-[#25222D] text-[#AAA6B5]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">1. Logística e Expedição</div>
                  <div className="text-[10px] text-[#AAA6B5]">Recebimento, estoque, posições e despacho</div>
                </div>
                {formData.modulos.includes('logistica') && <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />}
              </button>

              <button
                type="button"
                onClick={() => handleModuleToggle('predial')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  formData.modulos.includes('predial')
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#F5F3FA]'
                    : 'border-[#393442] bg-[#25222D] text-[#AAA6B5]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">2. Gestão Predial & Portaria</div>
                  <div className="text-[10px] text-[#AAA6B5]">Controle de encomendas com PIN e visitantes</div>
                </div>
                {formData.modulos.includes('predial') && <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[#393442]">
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Senha de Administrador *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Confirmar Senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repita sua senha"
                  className="w-full bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Criar Ambiente e Iniciar Demonstração (7 Dias Gratuitos)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
