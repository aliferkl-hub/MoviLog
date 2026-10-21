import React, { useState } from 'react';
import { ReceiptsView } from './ReceiptsView';
import { InventoryView } from './InventoryView';
import { ShipmentsView } from './ShipmentsView';
import { Truck, Boxes, Send } from 'lucide-react';

export const LogisticsTabsView: React.FC = () => {
  const [subTab, setSubTab] = useState<'receipts' | 'inventory' | 'shipments'>('receipts');

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#393442] pb-3 overflow-x-auto">
        <button
          onClick={() => setSubTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === 'receipts'
              ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
              : 'text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Recebimento & QR Code</span>
        </button>

        <button
          onClick={() => setSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === 'inventory'
              ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
              : 'text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Estoque & Posições</span>
        </button>

        <button
          onClick={() => setSubTab('shipments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === 'shipments'
              ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25'
              : 'text-[#AAA6B5] hover:text-[#F5F3FA] hover:bg-[#25222D]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Expedição & Despacho</span>
        </button>
      </div>

      {/* Render selected view */}
      {subTab === 'receipts' && <ReceiptsView />}
      {subTab === 'inventory' && <InventoryView />}
      {subTab === 'shipments' && <ShipmentsView />}
    </div>
  );
};
