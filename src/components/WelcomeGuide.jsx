import React from 'react';
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                {/* Header Guía */}
                <div className="bg-slate-50 p-6 flex flex-col items-center text-center border-b border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                        {icon}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{content.title}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t.guide.manual}</p>
                </div>

                {/* Pasos */}
                <div className="p-6 space-y-5">
                    {content.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{step.t}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.d}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        {t.common.understand}
                    </button>
                </div>
            </div>
        </div>
    );
};
