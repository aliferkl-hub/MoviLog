import React, { useState, useEffect } from 'react';
import { DeliveryItem } from '../../types';
import { api } from '../../lib/api';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Package,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  Building,
  UserCheck
} from 'lucide-react';

interface ClientAggregation {
  nome: string;
  telefone: string;
  enderecoPrincipal: string;
  bairro: string;
  cidade: string;
  cep: string;
  totalEntregas: number;
  entregues: number;
  pendentes: number;
  insucessos: number;
  ultimaEntrega?: string;
}

export const ClientsView: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveries();
      setDeliveries(res.deliveries || []);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregate by recipient name
  const clientsMap = new Map<string, ClientAggregation>();

  deliveries.forEach((d) => {
    const key = (d.destinatario || 'Sem Nome').trim().toLowerCase();
    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        nome: d.destinatario || 'Sem Nome',
        telefone: d.telefone || 'Não informado',
        enderecoPrincipal: `${d.endereco}, ${d.numero}${d.complemento ? ' - ' + d.complemento : ''}`,
        bairro: d.bairro || '',
        cidade: d.cidade || '',
        cep: d.cep || '',
        totalEntregas: 0,
        entregues: 0,
        pendentes: 0,
        insucessos: 0,
        ultimaEntrega: d.criadoEm
      });
    }

    const item = clientsMap.get(key)!;
    item.totalEntregas += 1;
    if (d.status === 'entregue') item.entregues += 1;
    else if (d.status === 'pendente') item.pendentes += 1;
    else if (d.status === 'tentativa_falha') item.insucessos += 1;

    if (new Date(d.criadoEm) > new Date(item.ultimaEntrega || 0)) {
      item.ultimaEntrega = d.criadoEm;
    }
  });

  const clients = Array.from(clientsMap.values());
  const filtered = clients.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.nome.toLowerCase().includes(term) ||
      c.bairro.toLowerCase().includes(term) ||
      c.cidade.toLowerCase().includes(term) ||
      c.telefone.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0b0d14] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Diretório de Clientes & Destinatários</span>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/30">
                {clients.length} destinatários ativos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Histórico consolidado de pedidos, endereços validados e taxas de sucesso por cliente
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, bairro ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-64"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Clients */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span className="text-xs">Carregando diretório de clientes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0c0e16] border border-slate-800 text-slate-500 text-xs">
          Nenhum destinatário encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#0c0e16] border border-slate-800 hover:border-violet-500/40 transition shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{c.nome}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{c.telefone}</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/30">
                  {c.totalEntregas} entregas
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/80">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{c.enderecoPrincipal} • {c.bairro} - {c.cidade}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Entregues</span>
                  <span className="text-xs font-bold text-emerald-400">{c.entregues}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Pendentes</span>
                  <span className="text-xs font-bold text-amber-400">{c.pendentes}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Insucesso</span>
                  <span className="text-xs font-bold text-rose-400">{c.insucessos}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
