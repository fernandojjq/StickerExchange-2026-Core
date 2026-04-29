// ============================================================================
// ARCHIVO: src/components/HistoryPanel.jsx
// VERSIÓN: 11.0 - Panel de historial para la pestaña Swap
// ============================================================================

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Icons } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

// ============================================================================
// Componente: HistoryEntry (Una entrada del historial)
// ============================================================================
const HistoryEntry = ({ entry }) => {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    const isLive = entry.type === 'live';
    const typeLabel = isLive ? t.swap.live_btn : t.swap.offline_btn;
    const typeBgClass = isLive ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500';

    return (
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm transition-all hover:shadow-md">
            {/* Header Clickable */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer"
            >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{formattedDate}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeBgClass}`}>
                            {isLive ? '🔴' : '📷'} {typeLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300">
                            #{entry.id?.slice(-5) || '-----'}
                        </span>
                        <Icons.ArrowDown className={`w-3 h-3 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Resumen (si está colapsado) */}
                {!isExpanded && (
                    <div className="flex justify-between items-end mt-2">
                        <div className="flex gap-3 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1">
                                <Icons.ArrowDown className="w-3 h-3 text-emerald-500" />
                                {t.history.received}: {entry.receivedCount || entry.received?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <Icons.ArrowUp className="w-3 h-3 text-indigo-500" />
                                {t.history.given}: {entry.givenCount || entry.given?.length || 0}
                            </span>
                        </div>
                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            {t.history.details} <Icons.ArrowDown className="w-3 h-3" />
                        </span>
                    </div>
                )}
            </div>

            {/* Detalles Expandidos */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-50 animate-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Recibidos */}
                        <div className="bg-emerald-50/50 rounded-lg p-2">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-1">
                                <Icons.ArrowDown className="w-3 h-3" />
                                {t.history.received} ({entry.received?.length || 0})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {(entry.received || []).map(id => (
                                    <span key={id} className="text-[9px] font-mono font-bold bg-white text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 shadow-sm">
                                        {id}
                                    </span>
                                ))}
                                {(!entry.received || entry.received.length === 0) && (
                                    <span className="text-[9px] text-slate-400 italic">{t.common.none}</span>
                                )}
                            </div>
                        </div>

                        {/* Entregados */}
                        <div className="bg-indigo-50/50 rounded-lg p-2">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-1">
                                <Icons.ArrowUp className="w-3 h-3" />
                                {t.history.given} ({entry.given?.length || 0})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {(entry.given || []).map(id => (
                                    <span key={id} className="text-[9px] font-mono font-bold bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">
                                        {id}
                                    </span>
                                ))}
                                {(!entry.given || entry.given.length === 0) && (
                                    <span className="text-[9px] text-slate-400 italic">{t.common.none}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isLive && entry.roomCode && (
                        <div className="mt-2 text-right">
                            <span className="text-[9px] text-slate-300 font-mono">
                                Sala: {entry.roomCode}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Componente Principal: HistoryPanel
// ============================================================================
export const HistoryPanel = ({ refreshTrigger = 0 }) => {
    const { t } = useLanguage();
    const [history, setHistory] = useState(() => storage.getHistory());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (refreshTrigger > 0) {
            setTimeout(() => setHistory(storage.getHistory()), 0);
        }
    }, [refreshTrigger]);

    // Limpiar historial
    const handleClearHistory = () => {
        if (confirm(t.history.clear_confirm)) {
            storage.clearHistory();
            setHistory([]);
        }
    };

    // Calcular estadísticas
    const stats = history.reduce((acc, entry) => {
        acc.totalReceived += entry.receivedCount || entry.received?.length || 0;
        acc.totalGiven += entry.givenCount || entry.given?.length || 0;
        acc.liveCount += entry.type === 'live' ? 1 : 0;
        acc.offlineCount += entry.type !== 'live' ? 1 : 0;
        return acc;
    }, { totalReceived: 0, totalGiven: 0, liveCount: 0, offlineCount: 0 });

    return (
        <div className="mt-6">
            {/* Header colapsable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition active:scale-[0.99]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <Icons.Exchange className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-800">{t.history.title}</h3>
                        <p className="text-xs text-slate-400">
                            {history.length} {history.length !== 1 ? t.history.plural : t.history.singular}
                            {history.length > 0 && (
                                <span className="ml-1">
                                    • +{stats.totalReceived} / -{stats.totalGiven}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Badges de tipo */}
                    {history.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                            {stats.liveCount > 0 && (
                                <span className="text-[9px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded font-bold">
                                    🔴 {stats.liveCount}
                                </span>
                            )}
                            {stats.offlineCount > 0 && (
                                <span className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                    📷 {stats.offlineCount}
                                </span>
                            )}
                        </div>
                    )}
                    <svg
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Contenido expandible */}
            {isExpanded && (
                <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {history.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.Exchange className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">{t.history.empty}</p>
                            <p className="text-xs text-slate-300 mt-1">
                                {t.history.desc}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Lista de entradas */}
                            {history.map(entry => (
                                <HistoryEntry key={entry.id} entry={entry} />
                            ))}

                            {/* Botón de limpiar */}
                            <button
                                onClick={handleClearHistory}
                                className="w-full text-center text-xs text-rose-500 font-bold py-3 hover:bg-rose-50 rounded-xl transition"
                            >
                                <Icons.Trash className="w-3 h-3 inline mr-1" />
                                {t.history.clear_btn}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
