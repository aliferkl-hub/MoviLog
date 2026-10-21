import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CondoPackage, AuditLog } from '../../types';
import { History, Search, Package, Clock, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { isMaster, company } = useAuth();
  const [packages, setPackages] = useState<CondoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'retirados' | 'portaria'>('todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.getCondoPackages(isMaster ? undefined : company?.id);
        setPackages(res.packages || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isMaster, company?.id]);

  const filtered = packages.filter(p => {
    const term = searchTerm.toLowerCase();
    const match =
      p.codigoPacote.toLowerCase().includes(term) ||
      p.destinatarioNome.toLowerCase().includes(term) ||
      p.unidadeIdentificacao.toLowerCase().includes(term) ||
      p.transportadora.toLowerCase().includes(term);

    if (filterType === 'retirados') return match && p.status === 'retirado';
    if (filterType === 'portaria') return match && p.status !== 'retirado';
    return match;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA] flex items-center gap-2">
            <History className="w-5 h-5 text-[#8B5CF6]" />
            <span>Consulta & Histórico Operacional</span>
          </h2>
          <p className="text-xs text-[#AAA6B5]">
            Rastreabilidade completa de recebimentos, retiradas e conformidade da portaria
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#AAA6B5] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, morador ou unidade..."
              className="bg-[#25222D] border border-[#393442] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8B5CF6] w-64"
            />
          </div>
          <div className="flex items-center p-0.5 bg-[#1D1B24] border border-[#393442] rounded-xl text-xs">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-2.5 py-1 rounded-lg ${filterType === 'todos' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-[#AAA6B5]'}`}
            >
              Todos ({packages.length})
            </button>
            <button
              onClick={() => setFilterType('retirados')}
              className={`px-2.5 py-1 rounded-lg ${filterType === 'retirados' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-[#AAA6B5]'}`}
            >
              Entregues ({packages.filter(p => p.status === 'retirado').length})
            </button>
            <button
              onClick={() => setFilterType('portaria')}
              className={`px-2.5 py-1 rounded-lg ${filterType === 'portaria' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-[#AAA6B5]'}`}
            >
              Na Portaria ({packages.filter(p => p.status !== 'retirado').length})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#25222D] border border-[#393442] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#1D1B24] text-[#AAA6B5] uppercase tracking-wider text-[10px] border-b border-[#393442]">
              <tr>
                <th className="p-3.5">Código / PIN</th>
                <th className="p-3.5">Unidade & Morador</th>
                <th className="p-3.5">Transportadora / Conteúdo</th>
                <th className="p-3.5">Recebido em</th>
                <th className="p-3.5">Retirado em</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393442]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#AAA6B5]">
                    Carregando histórico do banco de dados...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#AAA6B5]">
                    Nenhum registro localizado para a busca atual.
                  </td>
                </tr>
              ) : (
                filtered.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-[#1D1B24]/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-[#F5F3FA] font-mono">{pkg.codigoPacote}</div>
                      <div className="text-[10px] font-mono text-[#C4B5FD]">PIN: {pkg.codigoRetiradaPin}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#F5F3FA]">{pkg.unidadeIdentificacao}</div>
                      <div className="text-[11px] text-[#AAA6B5]">{pkg.destinatarioNome}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-[#F5F3FA]">{pkg.transportadora}</div>
                      <div className="text-[11px] text-[#AAA6B5] truncate max-w-xs">{pkg.descricaoConteudo}</div>
                    </td>
                    <td className="p-3.5 text-[#AAA6B5] font-mono text-[11px]">
                      {new Date(pkg.recebidoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 text-[#AAA6B5] font-mono text-[11px]">
                      {pkg.retiradoEm ? new Date(pkg.retiradoEm).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      {pkg.status === 'retirado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Entregue</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                          <Clock className="w-3 h-3 text-[#8B5CF6]" />
                          <span>Na Portaria</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
