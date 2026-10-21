import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Building, Phone, Save, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { company, isMaster } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nomeFantasia: company?.nomeFantasia || 'LogiPredial Sede Matriz',
    razaoSocial: company?.razaoSocial || 'LogiPredial - Gestão Operacional Ltda',
    cnpj: company?.cnpj || '00.000.000/0001-91',
    telefone: company?.telefone || '11973479473',
    endereco: company?.endereco || 'Av. Paulista, 1000 - São Paulo/SP'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#8B5CF6]" />
          <span>Configurações Operacionais</span>
        </h2>
        <p className="text-xs text-[#AAA6B5]">
          Dados cadastrais da empresa, parâmetros de notificação e portaria
        </p>
      </div>

      <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-6 shadow-sm max-w-2xl">
        {saved && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[#A7F3D0] text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Nome Fantasia do Condomínio / Empresa</label>
            <input
              type="text"
              value={form.nomeFantasia}
              onChange={e => setForm({ ...form, nomeFantasia: e.target.value })}
              className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Razão Social</label>
            <input
              type="text"
              value={form.razaoSocial}
              onChange={e => setForm({ ...form, razaoSocial: e.target.value })}
              className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: e.target.value })}
                className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#AAA6B5] mb-1">WhatsApp / Telefone da Portaria</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: e.target.value })}
                className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAA6B5] mb-1">Endereço Completo</label>
            <input
              type="text"
              value={form.endereco}
              onChange={e => setForm({ ...form, endereco: e.target.value })}
              className="w-full bg-[#1D1B24] border border-[#393442] rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-[#7C3AED]/25"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </form>
      </div>
    </div>
  );
};
