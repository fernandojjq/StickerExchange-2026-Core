// ============================================================================
// ARCHIVO: src/pages/Profile.jsx
// VERSIÓN: 15.0 - Estadísticas con Formato Recolectado/Total
// ============================================================================

import { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { Protocol } from '../utils/protocol';
import { Icons } from '../components/Icons';
import { ALBUM_MANIFEST } from '../data/albumManifest';

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
// Generador de Tarjeta de Estado (Estilo Original - 1350px con Grid)
// ============================================================================
const generateStatusCard = async (userName, completion, countryData, stats, categoryStats) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350; 
    const ctx = canvas.getContext('2d');

    const safeCompletion = isNaN(completion) ? 0 : completion;

    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.3, '#1e1b4b');
    gradient.addColorStop(0.6, '#312e81');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Decoración
    ctx.beginPath();
    ctx.arc(950, 80, 200, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.fill();

    // Cabecera
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SWAP-26', 540, 70);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('Estado de Colección', 540, 110);

    // Nombre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText(userName || 'Coleccionista', 540, 220);

    // Círculo de progreso
    const cx = 540, cy = 420, radius = 130;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 25;
    ctx.stroke();

    const endAngle = -Math.PI / 2 + (safeCompletion / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, endAngle);
    const progressGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    progressGrad.addColorStop(0, '#6366f1');
    progressGrad.addColorStop(1, '#10b981');
    ctx.strokeStyle = progressGrad;
    ctx.lineWidth = 25;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText(`${safeCompletion}%`, cx, cy + 30);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`${stats.unique}/${ALBUM_CONFIG.FULL_TOTAL} únicos • ${stats.repeated} repetidos`, cx, cy + radius + 60);

    // Estadísticas detalladas
    const statsY = 680;
    
    // Álbum Base
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('ÁLBUM BASE', 120, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`${categoryStats.baseCollected}/980`, 120, statsY + 45);
    
    // Coca-Cola
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('PROMOCIONALES', 600, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${categoryStats.cokeCollected}/14`, 600, statsY + 45);

    // Grid de países (Estilo visual original)
    const gridStartX = 140;
    const gridStartY = 850;
    const cellSize = 65;
    const cols = 10;
    const gap = 15;

    countryData.slice(0, 30).forEach((country, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridStartX + col * (cellSize + gap);
        const y = gridStartY + row * (cellSize + gap);

        let color = 'rgba(100, 116, 139, 0.2)';
        if (country.pct > 0) color = 'rgba(99, 102, 241, 0.4)';
        if (country.pct > 50) color = 'rgba(99, 102, 241, 0.7)';
        if (country.pct === 100) color = 'rgba(16, 185, 129, 0.9)';

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

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `swap26_card_${userName}.png`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
        }, 'image/png');
    });
};

// ============================================================================
// Componente Profile
// ============================================================================
export const Profile = () => {
    const [user, setUser] = useState(() => storage.getUser() || { name: 'Coleccionista' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingBackup, setPendingBackup] = useState(null);

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
            .filter(s => s.country && s.country !== 'INT' && !['FWC', 'EXT', 'CC'].includes(s.country))
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

    const handleReset = () => {
        if (confirm('¿ESTÁS SEGURO? Se borrarán todos tus datos permanentemente.')) {
            storage.clear();
            window.location.reload();
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        await generateStatusCard(user.name, categoryStats.completion, countryData, stats, categoryStats);
        setIsGenerating(false);
    };

    return (
        <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
            
            {/* Cabecera de Perfil */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-6 rounded-3xl shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md">
                        <Icons.User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest block mb-1">Tu Nombre</label>
                        <input
                            type="text"
                            value={user.name}
                            onChange={handleNameChange}
                            className="bg-transparent text-xl font-black text-white border-b border-white/20 focus:border-white focus:outline-none w-full"
                        />
                    </div>
                </div>

                {/* Grid de Stats (4 Columnas) - FORMATO RECOLECTADO/TOTAL */}
                <div className="grid grid-cols-4 gap-2 text-center mb-6 relative z-10">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black whitespace-nowrap">{stats.unique}/{ALBUM_CONFIG.FULL_TOTAL}</div>
                        <div className="text-[8px] uppercase opacity-60">Únicos</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black whitespace-nowrap">{Math.min(categoryStats.baseCollected, 980)}/980</div>
                        <div className="text-[8px] uppercase opacity-60">Base</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black text-amber-300 whitespace-nowrap">{categoryStats.cokeCollected}/14</div>
                        <div className="text-[8px] uppercase opacity-60">Promo</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-black text-emerald-300 whitespace-nowrap">{categoryStats.extraCollected}/20</div>
                        <div className="text-[8px] uppercase opacity-60">Extras</div>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div className="space-y-3 relative z-10">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span>PROGRESO ÁLBUM</span>
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
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Equipos</div>
                        <div className="text-lg font-black text-slate-900">
                            {countryData.filter(c => c.pct === 100).length} / 48
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Repetidas</div>
                    <div className="text-lg font-black text-rose-600">{stats.repeated}</div>
                </div>
            </div>

            {/* Gestión de Datos */}
            <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Copia de Seguridad</p>
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
                        Exportar
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
                        Importar
                    </button>
                </div>
                <p className="text-[9px] text-slate-400 pl-1 mb-6">Usa estos botones para guardar o restaurar tu inventario en otro dispositivo.</p>
            </div>

            {/* Acciones Finales */}
            <div className="space-y-3">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                    {isGenerating ? 'Generando...' : 'Descargar Tarjeta'}
                </button>
                <p className="text-[9px] text-slate-400 text-center px-4">Descarga una imagen con tu resumen de colección lista para compartir en redes.</p>
                
                <div className="pt-6">
                    <button 
                        onClick={handleReset}
                        className="w-full py-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                    >
                        Reiniciar Datos
                    </button>
                    <p className="text-[8px] text-rose-300 text-center uppercase tracking-tighter">Atención: Esta acción borrará todo tu progreso local.</p>
                </div>
            </div>

            {/* Modal de Restauración */}
            {showRestoreConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-black text-slate-900 text-center mb-4">Confirmar Restauración</h3>
                        <p className="text-sm text-slate-500 text-center mb-8">Esto reemplazará todos tus datos actuales. ¿Deseas continuar?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancelar</button>
                            <button 
                                onClick={() => {
                                    storage.restoreBackup(pendingBackup);
                                    window.location.reload();
                                }} 
                                className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl"
                            >
                                Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
