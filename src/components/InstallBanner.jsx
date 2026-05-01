import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Icons } from './Icons';

export const InstallBanner = () => {
    const { isInstallable, promptInstall } = useInstallPrompt();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detectar iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Detectar si ya está en modo standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(standalone);

        // Retrasar la aparición del banner para no agobiar al usuario apenas entra
        if ((isInstallable || isIosDevice) && !standalone) {
            const timer = setTimeout(() => {
                const hasDismissed = localStorage.getItem('swap26_dismissed_install');
                if (!hasDismissed) {
                    setIsVisible(true);
                }
            }, 3000); // Mostrar después de 3 segundos
            return () => clearTimeout(timer);
        }
    }, [isInstallable]);

    const handleDismiss = () => {
        setIsVisible(false);
        // Guardar preferencia para no molestar más (por al menos una semana)
        localStorage.setItem('swap26_dismissed_install', Date.now().toString());
    };

    const handleInstall = async () => {
        if (isInstallable) {
            await promptInstall();
            setIsVisible(false);
        } else if (isIOS) {
            // En iOS no se puede disparar el prompt, solo mostrar instrucciones
            alert('Para instalar en iPhone: Toca el icono de "Compartir" en Safari (el cuadrado con flecha hacia arriba) y luego selecciona "Añadir a la pantalla de inicio".');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                        <Icons.Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-tight leading-tight">Instalar Swap-26</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight mt-0.5">Añade la app a tu inicio para entrar rápido y usarla offline.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={handleInstall}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors"
                    >
                        {isIOS ? 'Ver Cómo' : 'Instalar'}
                    </button>
                    <button 
                        onClick={handleDismiss}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <Icons.Close className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
