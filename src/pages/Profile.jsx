// ============================================================================
// ARCHIVO: src/pages/Profile.jsx
// VERSIÓN: 18.0 - Guía Contextual y Botón de Ayuda
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Protocol } from '../utils/protocol';
import { Icons } from '../components/Icons';
import { ALBUM_MANIFEST } from '../data/albumManifest';
import { WelcomeGuide } from '../components/WelcomeGuide';
import { useLanguage } from '../hooks/useLanguage';

// ============================================================================
// Configuración del Álbum
// ============================================================================
const ALBUM_CONFIG = {
    BASE_TOTAL: 980,
    COKE_TOTAL: 14,
    EXTRA_TOTAL: 20,
    FULL_TOTAL: 1014, // 980 + 14 + 20
    TOTAL_COUNTRIES: 48
};

// ============================================================================
// Generación de Tarjeta de Estatus (Canvas)
// ============================================================================
const generateStatusCard = async (userName, percentage, countryData, stats, categoryStats, t) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Tamaño 4:5 (Ideal para Instagram/Social)
    canvas.width = 1080;
    canvas.height = 1350;

    // Fondo degradado Premium
    const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Decoración de fondo (Círculos)
    ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
    ctx.beginPath();
    ctx.arc(1080, 0, 400, 0, Math.PI * 2);
    ctx.fill();

    // Encabezado
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SWAP-26', 80, 150);

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(t.profile.subtitle.toUpperCase(), 80, 200);

    // Tarjeta Principal de Usuario
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(80, 260, 920, 200, 40);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px system-ui, sans-serif';
    ctx.fillText(userName.toUpperCase() || 'SWAPPER', 140, 360);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 80px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${percentage}%`, 940, 380);
    ctx.textAlign = 'left';

    // Estadísticas
    const statsY = 560;
    
    // Únicos
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(t.album.stats_unique.toUpperCase(), 100, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`${stats.unique}/1014`, 100, statsY + 45);

    // Repetidos
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(t.album.stats_repeated.toUpperCase(), 340, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`${stats.repeated}`, 340, statsY + 45);

    // Coca-Cola
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(t.profile.stats_coke.toUpperCase(), 580, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`${categoryStats.cokeCollected}/14`, 580, statsY + 45);

    // Extras
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(t.profile.stats_extras.toUpperCase(), 820, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`${categoryStats.extraCollected}/20`, 820, statsY + 45);

    // Grid de países (Estilo visual original)
    const gridStartX = 140;
    const gridStartY = 720;
    const cellSize = 75;
    const gap = 15;

    countryData.forEach((country, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const x = gridStartX + col * (cellSize + gap);
        const y = gridStartY + row * (cellSize + gap);

        // Color según progreso
        let color = 'rgba(255,255,255,0.05)';
        if (country.pct === 100) color = '#10b981';
        else if (country.pct > 50) color = '#6366f1';
        else if (country.pct > 0) color = '#4338ca';

        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = country.pct > 50 ? '#ffffff' : 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(country.code, x + cellSize / 2, y + cellSize / 2 + 5);
    });

    // Pie de página
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Swap-26: Herramienta de Inventario', 540, 1250);

    const structureHash = Protocol.getStructureHash();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '10px monospace';
    ctx.fillText(`ID: ${structureHash}`, 540, 1320);

    // Descargar
    const link = document.createElement('a');
    link.download = `swap26_id_${userName.toLowerCase().replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

export const Profile = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState(() => storage.getUser());
    const [isGenerating, setIsGenerating] = useState(false);
    const [pendingBackup, setPendingBackup] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    const { stats, categoryStats, countryData } = useMemo(() => {
        const inventory = storage.getInventory();
        const unique = Object.values(inventory).filter(qty => qty > 0).length;
        const repeated = Object.values(inventory).reduce((acc, qty) => qty > 1 ? acc + (qty - 1) : acc, 0);

        let baseCollected = 0;
        let cokeCollected = 0;
        let extraCollected = 0;

        Object.keys(inventory).forEach(id => {
            if (inventory[id] <= 0) return;
            if (id.startsWith('CC-')) cokeCollected++;
            else if (id.startsWith('EXT-')) extraCollected++;
            else baseCollected++;
        });

        const baseTarget = ALBUM_CONFIG.BASE_TOTAL;
        const completion = Math.round((Math.min(baseCollected, baseTarget) / baseTarget) * 100) || 0;

        const countries = [];
        ALBUM_MANIFEST.flatMap(g => g.sections)
            .filter(s => s.country && s.country !== 'INT' && !['EXT', 'CC'].includes(s.country))
            .filter((v, i, a) => a.findIndex(t => t.country === v.country) === i)
            .forEach(section => {
                const code = section.country;
                const collected = Object.keys(inventory).filter(k => k.startsWith(code + '-') && inventory[k] > 0).length;
                const pct = Math.round((collected / 20) * 100);
                countries.push({ code, pct });
            });

        return {
            stats: { unique, repeated },
            categoryStats: {
                baseCollected,
                cokeCollected,
                extraCollected,
                completion
            },
            countryData: countries
        };
    }, []);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        const newUser = { ...user, name: newName };
        setUser(newUser);
        storage.saveUser(newUser);
    };

    const handleClearData = () => {
        if (window.confirm(t.profile.reset_confirm || "¿Estás seguro?")) {
            storage.clear();
            window.location.reload();
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        await generateStatusCard(user.name, categoryStats.completion, countryData, stats, categoryStats, t);
        setIsGenerating(false);
    };

    return (
        <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
            <WelcomeGuide isOpen={showGuide} onClose={() => setShowGuide(false)} type="profile" />

            {/* HEADER SUPERIOR */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Icons.User className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">{t.profile.title}</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.profile.subtitle}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleClearData}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100"
                        title={t.profile.reset_data}
                    >
                        <Icons.Trash className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setShowGuide(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200"
                        title={t.album.help_title}
                    >
                        <Icons.Info className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {/* Cabecera de Perfil */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-6 rounded-3xl shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md">
                        <Icons.User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest block mb-1">{t.profile.name_placeholder}</label>
                        <input
                            type="text"
                            value={user.name}
                            onChange={handleNameChange}
                            placeholder={t.profile.name_placeholder}
                            className="bg-transparent text-xl font-black text-white border-b border-white/20 focus:border-white focus:outline-none w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6 relative z-10 text-center">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black whitespace-nowrap">{stats.unique}/1014</div>
                        <div className="text-[8px] uppercase opacity-60">{t.album.stats_unique}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black text-amber-300 whitespace-nowrap">{categoryStats.cokeCollected}/14</div>
                        <div className="text-[8px] uppercase opacity-60">{t.album.type_promo}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black text-emerald-300 whitespace-nowrap">{categoryStats.extraCollected}/20</div>
                        <div className="text-[8px] uppercase opacity-60">{t.album.type_extras}</div>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="uppercase">{t.profile.stats_completion}</span>
                            <span>{categoryStats.completion}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${categoryStats.completion}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen de Equipos */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Icons.Flag className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{t.profile.stats_teams}</div>
                        <div className="text-lg font-black text-slate-900">
                            {countryData.filter(c => c.pct === 100).length} / 48
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{t.album.stats_repeated}</div>
                    <div className="text-lg font-black text-rose-600">{stats.repeated}</div>
                </div>
            </div>

            {/* Gestión de Datos */}
            <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">{t.profile.backup_title}</p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button 
                        onClick={() => {
                            const data = storage.getFullBackup();
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `swap26_backup.json`;
                            a.click();
                        }}
                        className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-600 font-bold py-4 px-4 rounded-2xl border border-emerald-500/20 active:scale-95 transition-all"
                    >
                        <Icons.Download className="w-5 h-5" />
                        {t.profile.backup_export}
                    </button>
                    <button 
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    setPendingBackup(ev.target.result);
                                    setShowRestoreConfirm(true);
                                };
                                reader.readAsText(file);
                            };
                            input.click();
                        }}
                        className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-600 font-bold py-4 px-4 rounded-2xl border border-amber-500/20 active:scale-95 transition-all"
                    >
                        <Icons.Upload className="w-5 h-5" />
                        {t.profile.backup_import}
                    </button>
                </div>
                <p className="text-[9px] text-slate-400 pl-1 mb-6">{t.profile.backup_desc}</p>
            </div>

            {/* Acciones Finales */}
            <div className="space-y-3">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                    {isGenerating ? t.common.generating : t.profile.share_btn}
                </button>
                <p className="text-[9px] text-slate-400 text-center px-4">{t.profile.share_desc}</p>
                
                <div className="pt-6 pb-12">
                    <button 
                        onClick={handleClearData}
                        className="w-full py-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                    >
                        {t.profile.reset_btn}
                    </button>
                    <p className="text-[8px] text-rose-300 text-center uppercase tracking-tighter">{t.profile.reset_warn}</p>
                </div>
            </div>

            {/* Modal de Restauración */}
            {showRestoreConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                    <div className="relative bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900 mb-2 uppercase">{t.profile.restore_title}</h3>
                        <p className="text-sm text-slate-500 mb-6">{t.profile.restore_desc}</p>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => {
                                    storage.restoreBackup(pendingBackup);
                                    window.location.reload();
                                }}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl"
                            >
                                {t.profile.restore_confirm_btn}
                            </button>
                            <button 
                                onClick={() => {
                                    setShowRestoreConfirm(false);
                                    setPendingBackup(null);
                                }}
                                className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl"
                            >
                                {t.common.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
