import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, ShieldCheck, UserPlus, KeyRound, Mail, Phone } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user, isMaster, company } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8B5CF6]" />
            <span>Usuários & Permissões</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Controle de porteiros, conferentes, operadores de logística e administradores
          </p>
        </div>
      </div>

      <div className="bg-[#25222D] border border-[#393442] rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#F5F3FA] mb-4">Usuário Ativo na Sessão</h3>
        <div className="flex items-center gap-4 p-4 bg-[#1D1B24] border border-[#393442] rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] font-bold text-lg">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F5F3FA]">{user?.name}</span>
              {isMaster && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40 font-mono">
                  Master Owner
                </span>
              )}
            </div>
            <div className="text-xs text-[#AAA6B5] flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>{user?.email}</span>
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{user.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[#393442] pt-4">
          <h4 className="text-xs font-bold text-[#AAA6B5] uppercase tracking-wider mb-2">Hierarquia de Permissões</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#1D1B24] border border-[#393442] rounded-xl">
              <div className="font-bold text-xs text-[#C4B5FD]">Master Owner</div>
              <p className="text-[11px] text-[#AAA6B5] mt-1">
                Acesso irrestrito a todas as empresas, configurações globais e aprovação financeira.
              </p>
            </div>
            <div className="p-3 bg-[#1D1B24] border border-[#393442] rounded-xl">
              <div className="font-bold text-xs text-[#F5F3FA]">Administrador de Empresa</div>
              <p className="text-[11px] text-[#AAA6B5] mt-1">
                Gestão total dos módulos contratados, cadastro de unidades, moradores e expedição.
              </p>
            </div>
            <div className="p-3 bg-[#1D1B24] border border-[#393442] rounded-xl">
              <div className="font-bold text-xs text-[#F5F3FA]">Portaria & Operador</div>
              <p className="text-[11px] text-[#AAA6B5] mt-1">
                Recebimento ágil com PIN, baixa de encomendas e controle de visitantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
