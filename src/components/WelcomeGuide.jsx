import React from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

export const WelcomeGuide = ({ isOpen, onClose, type = 'album' }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    const GUIDE_ICONS = {
        album: <Icons.Album className="w-8 h-8 text-indigo-500" />,
        swap: <Icons.Exchange className="w-8 h-8 text-emerald-500" />,
        profile: <Icons.User className="w-8 h-8 text-amber-500" />
    };

    const content = t.guide[type] || t.guide.album;
    const icon = GUIDE_ICONS[type] || GUIDE_ICONS.album;

    // Usamos createPortal para renderizar la guía fuera del DOM del álbum
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            {/* Fondo con blur mejorado */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
                onClick={onClose}
            ></div>
            
            {/* Contenedor de la Guía */}
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                {/* Header Guía */}
                <div className="bg-slate-50 p-6 flex flex-col items-center text-center border-b border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 transform -rotate-3">
                        {icon}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic leading-tight">{content.title}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.guide.manual}</p>
                </div>

                {/* Pasos */}
                <div className="p-6 space-y-5">
                    {content.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                                {idx + 1}
                            </div>
                            <div className="pt-0.5">
                                <h4 className="text-[13px] font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tight">{step.t}</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{step.d}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-xl shadow-indigo-200"
                    >
                        {t.common.understand}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
