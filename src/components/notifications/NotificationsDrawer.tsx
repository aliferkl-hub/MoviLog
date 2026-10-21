import React from 'react';
import { NotificationItem } from '../../types';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  Package,
  Info,
  CheckCheck
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.lida).length;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'fiscal':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'entrega':
        return <Package className="w-4 h-4 text-[#8B5CF6]" />;
      case 'frota':
        return <Truck className="w-4 h-4 text-sky-400" />;
      case 'portaria':
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-[#AAA6B5]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121024] border-l border-[#2D2644] text-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#2D2644] flex items-center justify-between bg-[#16132C]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Central de Alertas & Notificações</h3>
                <span className="text-[10px] text-[#AAA6B5]">
                  {unreadCount > 0 ? `${unreadCount} alerta(s) não lido(s)` : 'Tudo atualizado'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="px-2.5 py-1 rounded-lg bg-[#1C1829] hover:bg-[#252037] border border-[#2D2644] text-[10px] font-semibold text-[#AAA6B5] hover:text-white transition flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3 h-3 text-[#8B5CF6]" />
                  <span>Ler tudo</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#AAA6B5] hover:text-white hover:bg-[#1C1829] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#2D2644]/60 p-2">
            {notifications.length === 0 ? (
              <div className="py-20 text-center text-[#AAA6B5]">
                <Bell className="w-8 h-8 text-[#716A85] mx-auto mb-2 opacity-50" />
                <span className="text-xs">Nenhuma notificação registrada no momento.</span>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`p-3.5 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                    !n.lida
                      ? 'bg-[#1C1829] border border-[#8B5CF6]/30 shadow-sm'
                      : 'hover:bg-[#16132C]/60 opacity-75'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0D0B18] border border-[#2D2644] flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(n.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{n.titulo}</span>
                      <span className="text-[10px] text-[#716A85] font-mono shrink-0">
                        {new Date(n.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#AAA6B5] mt-1 leading-relaxed">{n.mensagem}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        n.prioridade === 'urgente' || n.prioridade === 'alta'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30'
                      }`}>
                        {n.tipo}
                      </span>
                      {!n.lida && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
