import { useState, useEffect } from 'react';

export const useInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Detectar si ya está instalada (standalone) o en iOS
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isStandalone) {
            return; // Ya está instalada, no hacemos nada
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevenir que Chrome muestre el prompt nativo pequeño
            e.preventDefault();
            // Guardar el evento para poder llamarlo luego cuando el usuario haga click
            setInstallPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            // El usuario aceptó la instalación y se completó
            setIsInstallable(false);
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) return false;
        
        // Mostrar el prompt nativo
        installPrompt.prompt();
        
        // Esperar a que el usuario responda
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        
        setInstallPrompt(null);
        return outcome === 'accepted';
    };

    return { isInstallable, promptInstall };
};
