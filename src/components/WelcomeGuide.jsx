import React from 'react';
import { Icons } from './Icons';

export const WelcomeGuide = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-600 p-8 text-center relative">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-md">
                        <Icons.Logo className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Bienvenido a Swap-26</h2>
                    <p className="text-indigo-100 text-sm mt-2">La forma más rápida de completar tu álbum.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icons.Album className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Gestiona tu álbum</h4>
                            <p className="text-slate-500 text-xs mt-1">Marca tus cromos, filtra por repetidos y mira tu progreso por país.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icons.QRCode className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Intercambio Offline</h4>
                            <p className="text-slate-500 text-xs mt-1">Genera tu QR y deja que otros lo escaneen para saber qué pueden intercambiar.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icons.Exchange className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Sincronización en Vivo</h4>
                            <p className="text-slate-500 text-xs mt-1">Conéctate con un amigo en tiempo real para negociar cromos a distancia.</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 uppercase tracking-widest text-sm"
                    >
                        ¡Entendido!
                    </button>
                </div>
            </div>
        </div>
    );
};
