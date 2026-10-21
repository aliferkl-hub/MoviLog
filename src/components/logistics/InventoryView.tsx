import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem } from '../../types';
import { api } from '../../lib/api';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  AlertCircle,
  Search,
  MapPin,
  X,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { user, company, isMaster } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New Item State
  const [itemForm, setItemForm] = useState({
    sku: '',
    nome: '',
    categoria: 'Geral',
    quantidade: 0,
    estoqueMinimo: 5,
    unidadeMedida: 'UN',
    setor: 'Galpão 1',
    corredor: 'C-01',
    posicao: 'P-01',
    valorUnitario: 0
  });

  // Movement State
  const [moveForm, setMoveForm] = useState({
    tipo: 'entrada' as 'entrada' | 'saida' | 'transferencia' | 'ajuste',
    quantidade: 1,
    motivo: '',
    destino: ''
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getInventory(isMaster ? undefined : company?.id);
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [company?.id]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveInventoryItem(itemForm);
      setShowItemModal(false);
      setItemForm({
        sku: '',
        nome: '',
        categoria: 'Geral',
        quantidade: 0,
        estoqueMinimo: 5,
        unidadeMedida: 'UN',
        setor: 'Galpão 1',
        corredor: 'C-01',
        posicao: 'P-01',
        valorUnitario: 0
      });
      await loadInventory();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto');
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMove) return;

    try {
      await api.recordStockMovement({
        itemId: selectedItemForMove.id,
        tipo: moveForm.tipo,
        quantidade: moveForm.quantidade,
        motivo: moveForm.motivo,
        destino: moveForm.destino
      });
      setShowMovementModal(false);
      setSelectedItemForMove(null);
      await loadInventory();
    } catch (err: any) {
      alert(err.message || 'Erro ao movimentar estoque');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            <span>Estoque, Posições e Movimentações</span>
          </h2>
          <p className="text-xs text-slate-400">
            Localização física por setor, corredor e posição, histórico e controle de saldos
          </p>
        </div>

        <button
          onClick={() => setShowItemModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Produto</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nome, categoria ou posição..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">SKU / Código</th>
                <th className="p-3.5">Nome do Produto</th>
                <th className="p-3.5">Localização Física</th>
                <th className="p-3.5">Saldo em Estoque</th>
                <th className="p-3.5">Estoque Mínimo</th>
                <th className="p-3.5">Valor Unitário</th>
                <th className="p-3.5 text-right">Movimentar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Nenhum produto cadastrado no estoque ainda.
                  </td>
                </tr>
              ) : (
                items
                  .filter(i =>
                    i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    i.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    i.setor.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(item => {
                    const isLowStock = item.quantidade <= item.estoqueMinimo;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-400">{item.sku}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{item.nome}</div>
                          <div className="text-[10px] text-slate-400">{item.categoria}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {item.setor} • {item.corredor} • <span className="font-bold text-white">{item.posicao}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white">
                              {item.quantidade} {item.unidadeMedida}
                            </span>
                            {isLowStock && (
                              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" /> Baixo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {item.estoqueMinimo} {item.unidadeMedida}
                        </td>
                        <td className="p-3.5 text-emerald-400 font-semibold">
                          R$ {item.valorUnitario.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedItemForMove(item);
                              setMoveForm({
                                tipo: 'entrada',
                                quantidade: 1,
                                motivo: '',
                                destino: item.posicao
                              });
                              setShowMovementModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Movimentar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block md:hidden space-y-3">
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            Nenhum produto cadastrado no estoque ainda.
          </div>
        ) : (
          items
            .filter(i =>
              i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
              i.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
              i.setor.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(item => {
              const isLowStock = item.quantidade <= item.estoqueMinimo;

              return (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="font-bold text-white text-sm">{item.nome}</span>
                      <div className="text-[10px] font-mono text-indigo-400">SKU: {item.sku}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-white text-sm">
                        {item.quantidade} {item.unidadeMedida}
                      </span>
                      {isLowStock && (
                        <div className="text-[9px] font-bold text-rose-400">Estoque Baixo</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{item.setor} • {item.corredor} • <strong className="text-white">{item.posicao}</strong></span>
                    </div>
                    <div className="text-slate-400">
                      Categoria: {item.categoria} • Mínimo: {item.estoqueMinimo} {item.unidadeMedida}
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      Valor Unitário: R$ {item.valorUnitario.toFixed(2)}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedItemForMove(item);
                        setMoveForm({
                          tipo: 'entrada',
                          quantidade: 1,
                          motivo: '',
                          destino: item.posicao
                        });
                        setShowMovementModal(true);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Movimentar Saldo</span>
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
            <button
              onClick={() => setShowItemModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Cadastrar Item no Estoque</h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe a identificação, saldo inicial e posição física de armazenagem.
            </p>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={e => setItemForm({ ...itemForm, sku: e.target.value })}
                    placeholder="Ex: SKU-84920"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={itemForm.categoria}
                    onChange={e => setItemForm({ ...itemForm, categoria: e.target.value })}
                    placeholder="Ex: Embalagens / Componentes"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição / Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={itemForm.nome}
                  onChange={e => setItemForm({ ...itemForm, nome: e.target.value })}
                  placeholder="Ex: Caixa de Bobinas Térmicas 80x40"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Qtd Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.quantidade}
                    onChange={e => setItemForm({ ...itemForm, quantidade: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.estoqueMinimo}
                    onChange={e => setItemForm({ ...itemForm, estoqueMinimo: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={itemForm.unidadeMedida}
                    onChange={e => setItemForm({ ...itemForm, unidadeMedida: e.target.value })}
                    placeholder="UN, CX, KG"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Setor / Galpão</label>
                  <input
                    type="text"
                    value={itemForm.setor}
                    onChange={e => setItemForm({ ...itemForm, setor: e.target.value })}
                    placeholder="Galpão A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Corredor</label>
                  <input
                    type="text"
                    value={itemForm.corredor}
                    onChange={e => setItemForm({ ...itemForm, corredor: e.target.value })}
                    placeholder="C-02"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Posição / Prateleira</label>
                  <input
                    type="text"
                    value={itemForm.posicao}
                    onChange={e => setItemForm({ ...itemForm, posicao: e.target.value })}
                    placeholder="P-14"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valor Unitário Médio (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.valorUnitario}
                  onChange={e => setItemForm({ ...itemForm, valorUnitario: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && selectedItemForMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowMovementModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Movimentar: {selectedItemForMove.nome}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Saldo Atual: <span className="font-bold text-white">{selectedItemForMove.quantidade} {selectedItemForMove.unidadeMedida}</span> • Posição: {selectedItemForMove.posicao}
            </p>

            <form onSubmit={handleRecordMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Movimentação</label>
                <select
                  value={moveForm.tipo}
                  onChange={e => setMoveForm({ ...moveForm, tipo: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="entrada">Entrada (+) - Adicionar saldo</option>
                  <option value="saida">Saída (-) - Baixa operacional</option>
                  <option value="transferencia">Transferência de Posição / Corredor</option>
                  <option value="ajuste">Ajuste de Inventário (Sobrescrever contagem física)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {moveForm.tipo === 'ajuste' ? 'Nova Quantidade Contada' : 'Quantidade a Movimentar'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moveForm.quantidade}
                  onChange={e => setMoveForm({ ...moveForm, quantidade: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {moveForm.tipo === 'transferencia' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nova Posição de Destino</label>
                  <input
                    type="text"
                    required
                    value={moveForm.destino}
                    onChange={e => setMoveForm({ ...moveForm, destino: e.target.value })}
                    placeholder="Ex: P-22 ou Corredor C-04"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Justificativa / Motivo</label>
                <input
                  type="text"
                  required
                  value={moveForm.motivo}
                  onChange={e => setMoveForm({ ...moveForm, motivo: e.target.value })}
                  placeholder="Ex: Ordem de produção nº 402 ou conferência anual"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
