import React, { useState, useEffect, useCallback, useMemo, useRef, useDeferredValue } from 'react';
import { Sticker } from '../components/Sticker';
import { Flag } from '../components/Flag';
import { Icons } from '../components/Icons';
import { storage } from '../utils/storage';
import { ALBUM_MANIFEST, ENTITY_TYPES } from '../data/albumManifest';
import { COUNTRY_NAMES } from '../data/countries';
import { WelcomeGuide } from '../components/WelcomeGuide';

// ============================================================================
// 1. OPTIMIZED COMPONENTS
// ============================================================================

const ProgressRing = React.memo(({ progress, size = 38, stroke = 3.5 }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const safeProgress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));
    const offset = circumference - (safeProgress / 100) * circumference;

    return (
        <svg className="progress-ring absolute inset-0" width={size} height={size}>
            <circle className="text-slate-200" stroke="currentColor" strokeWidth={stroke} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
            <circle
                className="progress-ring__circle text-indigo-600 transition-all duration-500"
                stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
                style={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: offset }}
            />
        </svg>
    );
});

const StickerSection = React.memo(({ section, inventory, onIncrement, onDecrement, isSpecial }) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { rootMargin: '600px 0px', threshold: 0 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sectionRef} id={section.country ? `section-${section.country}` : null} className="scroll-mt-fix min-h-[140px]">
            <div className="mb-4 flex items-center gap-2 pl-2 mt-4">
                {section.country && <Flag iso={section.country} size="xs" />}
                <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{section.country || section.title}</div>
                <div className="h-px bg-slate-100 flex-1" />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
                {isVisible ? (
                    section.items.map(item => (
                        <Sticker
                            key={item.id} id={item.id} country={section.country || 'INT'} number={item.number}
                            quantity={inventory[item.id] || 0} onIncrement={onIncrement} onDecrement={onDecrement}
                            isSpecial={isSpecial} isUrgent={storage.isUrgent(item.id)}
                        />
                    ))
                ) : (
                    Array.from({ length: section.items.length }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-slate-50 border border-slate-100 rounded-lg" />
                    ))
                )}
            </div>
        </div>
    );
});

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export const Album = () => {
    const [inventory, setInventory] = useState(() => storage.getInventory());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCountry, setActiveCountry] = useState(null);
    const [filterMode, setFilterMode] = useState('all');
    const [isScrolled, setIsScrolled] = useState(false);
    
    // DEFAULT TO GROUP A for instant mount performance
    const [groupFilter, setGroupFilter] = useState('GROUP A');
    const [typeFilter, setTypeFilter] = useState('ALL'); 
    const [showGuide, setShowGuide] = useState(false);
    
    const navObserverRef = useRef(null);
    const deferredInventory = useDeferredValue(inventory);
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const { totalStickers, countryBases } = useMemo(() => {
        let total = 0;
        const bases = {};
        ALBUM_MANIFEST.forEach(group => {
            group.sections.forEach(section => {
                const country = section.country;
                if (!country || country === 'INT') return;
                if (!bases[country]) bases[country] = { total: 0, items: [] };
                section.items.forEach(item => {
                    total++;
                    bases[country].total++;
                    bases[country].items.push(item.id);
                });
            });
        });
        return { totalStickers: total || 1014, countryBases: bases };
    }, []);

    const filteredManifest = useMemo(() => {
        const query = deferredSearchQuery.toUpperCase();
        return ALBUM_MANIFEST.map(group => {
            // Logic to handle group filtering
            if (groupFilter !== 'ALL' && group.title !== groupFilter && group.id !== groupFilter) return null;
            
            const filteredSections = group.sections.map(section => {
                const isSpecialSection = ['FWC', 'EXT', 'CC'].includes(section.country);
                
                // TYPE FILTER Logic
                if (typeFilter === 'COKE' && section.country !== 'CC') return null;
                if (typeFilter === 'EXTRAS' && section.country !== 'EXT') return null;
                if (typeFilter === 'CREST' && isSpecialSection) return null;
                if (typeFilter === 'SPECIAL' && !isSpecialSection && section.type !== ENTITY_TYPES.VENUE && section.type !== ENTITY_TYPES.HEADER) return null;

                const countryMatch = section.country && (
                    section.country.includes(query) ||
                    (COUNTRY_NAMES[section.country] && COUNTRY_NAMES[section.country].some(name => name.includes(query)))
                );
                
                const matchedItems = section.items.filter(i => {
                    const matchesSearch = !query || countryMatch || i.id.includes(query) || i.number.toString() === query;
                    if (!matchesSearch) return false;
                    
                    if (typeFilter === 'CREST' && i.number !== '01') return false;
                    if (typeFilter === 'PLAYER' && i.itemType !== 'SQUAD') return false;
                    
                    if (filterMode !== 'all') {
                        const qty = deferredInventory[i.id] || 0;
                        if (filterMode === 'missing' && qty > 0) return false;
                        if (filterMode === 'repeats' && qty <= 1) return false;
                    }
                    return true;
                });
                
                if (matchedItems.length > 0) return { ...section, items: matchedItems };
                return null;
            }).filter(Boolean);
            
            if (filteredSections.length > 0) return { ...group, sections: filteredSections };
            return null;
        }).filter(Boolean);
    }, [deferredInventory, deferredSearchQuery, filterMode, groupFilter, typeFilter]);

    const stats = useMemo(() => {
        let unique = 0, repeated = 0;
        Object.values(deferredInventory).forEach(qty => {
            if (qty > 0) {
                unique++;
                if (qty > 1) repeated += (qty - 1);
            }
        });
        return { unique, repeated };
    }, [deferredInventory]);

    const progressPercentage = Math.round((stats.unique / totalStickers) * 100);

    const countryProgress = useMemo(() => {
        const progress = {};
        Object.entries(countryBases).forEach(([iso, base]) => {
            let collected = 0;
            base.items.forEach(id => { if (deferredInventory[id] > 0) collected++; });
            progress[iso] = { percentage: Math.round((collected / base.total) * 100) };
        });
        return progress;
    }, [deferredInventory, countryBases]);

    const navGroups = useMemo(() => {
        const allIsos = ALBUM_MANIFEST.filter(g => groupFilter === 'ALL' || g.title === groupFilter)
                                      .flatMap(g => g.sections.map(s => s.country))
                                      .filter((v, i, s) => v && s.indexOf(v) === i && v !== 'INT');
        return {
            teams: allIsos.filter(iso => !['FWC', 'EXT', 'CC'].includes(iso)),
            specials: allIsos.filter(iso => ['FWC', 'EXT', 'CC'].includes(iso))
        };
    }, [groupFilter]);

    const handleIncrement = useCallback((id) => {
        setInventory(prev => {
            const next = { ...prev, [id]: (prev[id] || 0) + 1 };
            storage.saveInventory(next);
            return next;
        });
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    }, []);

    const handleDecrement = useCallback((id) => {
        setInventory(prev => {
            if (!prev[id]) return prev;
            const next = { ...prev, [id]: prev[id] - 1 };
            storage.saveInventory(next);
            return next;
        });
        if (window.navigator.vibrate) window.navigator.vibrate(5);
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Tutorial Logic: Show only once
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('swap26_guide_seen');
        if (!hasSeenGuide) setShowGuide(true);
    }, []);

    const closeGuide = () => {
        setShowGuide(false);
        localStorage.setItem('swap26_guide_seen', 'true');
    };

    useEffect(() => {
        if (navObserverRef.current) navObserverRef.current.disconnect();
        navObserverRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.id?.startsWith('section-')) {
                    setActiveCountry(entry.target.id.replace('section-', ''));
                }
            });
        }, { rootMargin: '-150px 0px -60% 0px', threshold: 0 });
        const timer = setTimeout(() => {
            document.querySelectorAll('[id^="section-"]').forEach(s => navObserverRef.current.observe(s));
        }, 1000);
        return () => { clearTimeout(timer); if (navObserverRef.current) navObserverRef.current.disconnect(); };
    }, [filteredManifest]);

    return (
        <div className="bg-slate-50 min-h-screen">
            <WelcomeGuide isOpen={showGuide} onClose={closeGuide} />
            
            {/* HEADER */}
            <div className={`sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/60 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
                <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
                    <div className="flex items-end justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Icons.Logo className="w-6 h-6" /></div>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Swap-26</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Álbum</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-indigo-600 leading-none tracking-tighter">{progressPercentage}%</div>
                            <p className="text-[10px] font-mono text-slate-400 font-bold mt-1">{stats.unique}/{totalStickers}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
                            {['all', 'missing', 'repeats'].map(m => (
                                <button key={m} onClick={() => setFilterMode(m)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${filterMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                                    {m === 'all' ? 'Todo' : m === 'missing' ? 'Faltantes' : 'Repetidas'}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 relative">
                            <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 bg-slate-100 border rounded-xl text-sm focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search className="w-4 h-4" /></div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-1 items-center">
                        <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setTypeFilter('ALL'); }} className="bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none shrink-0">
                            <option value="ALL">TODOS LOS GRUPOS</option>
                            <option value="INTL COMPETITION 2026">ESPECIALES FWC</option>
                            {ALBUM_MANIFEST.filter(g => g.id.startsWith('group_')).map(g => <option key={g.id} value={g.title}>{g.title}</option>)}
                        </select>
                        
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'ALL', label: 'Todos' },
                                { id: 'CREST', label: 'Escudos' },
                                { id: 'COKE', label: 'Promo' },
                                { id: 'EXTRAS', label: 'Extras' },
                                { id: 'PLAYER', label: 'Jugadores' }
                            ].map(t => (
                                <button key={t.id} onClick={() => { setTypeFilter(t.id); if(t.id === 'COKE' || t.id === 'EXTRAS') setGroupFilter('ALL'); }} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap transition-all ${typeFilter === t.id ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!searchQuery && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 pl-1">
                            <div className="flex gap-3">
                                {navGroups.teams.map(iso => {
                                    const cp = countryProgress[iso] || { percentage: 0 };
                                    const isActive = activeCountry === iso;
                                    return (
                                        <button key={iso} onClick={() => { if(groupFilter === 'ALL' || navGroups.teams.includes(iso)) document.getElementById(`section-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`flex-shrink-0 relative w-10 h-10 flex items-center justify-center transition-all ${isActive ? 'scale-110' : 'grayscale opacity-60'}`}>
                                            <ProgressRing progress={cp.percentage} size={40} stroke={3} />
                                            <div className="relative z-10"><Flag iso={iso} size="sm" /></div>
                                            {cp.percentage === 100 && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center z-20"><Icons.Check className="w-2 h-2 text-white" /></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-4xl mx-auto px-4 space-y-12 mt-8 pb-32">
                {filteredManifest.length === 0 ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
                        <Icons.Search className="w-12 h-12 text-slate-200 mb-2" />
                        <p className="text-slate-400 font-bold">Sin resultados</p>
                        <button onClick={() => { setGroupFilter('ALL'); setTypeFilter('ALL'); setFilterMode('all'); }} className="mt-2 text-indigo-500 text-xs font-bold underline">Limpiar filtros</button>
                    </div>
                ) : (
                    filteredManifest.map((group, gIdx) => (
                        <div key={group.id || gIdx} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black italic tracking-tighter text-slate-300 uppercase">{group.title}</h2>
                                <div className="flex-1 h-1 bg-slate-200 rounded-full" />
                            </div>

                            {group.id === 'promo' && (
                                <p className="text-[10px] text-amber-500 font-bold -mt-6 mb-4 px-1 leading-relaxed">
                                    Colección especial de socio.<br />
                                    Estos stickers no cuentan para el progreso del álbum base.
                                </p>
                            )}

                            {group.id === 'extras' && (
                                <p className="text-[10px] text-amber-500 font-bold -mt-6 mb-4 px-1 leading-relaxed">
                                    Colección de stickers Extras/ Premium.<br />
                                    No forman parte de los 980 stickers del álbum principal.
                                </p>
                            )}
                            
                            <div className="space-y-12">
                                {group.sections.map((section, idx) => (
                                    <StickerSection 
                                        key={section.country || idx}
                                        section={section}
                                        inventory={inventory}
                                        onIncrement={handleIncrement}
                                        onDecrement={handleDecrement}
                                        isSpecial={['FWC', 'EXT', 'CC'].includes(section.country) || section.type === ENTITY_TYPES.HEADER || section.type === ENTITY_TYPES.VENUE}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
