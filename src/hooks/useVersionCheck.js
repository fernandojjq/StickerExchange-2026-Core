import { useEffect } from 'react';

export const useVersionCheck = () => {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    let sessionVersion = null;
    let pendingUpdate = false;

    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now());
        const data = await response.json();
        
        if (!sessionVersion) {
          sessionVersion = data.version;
          return;
        }

        if (data.version !== sessionVersion) {
          console.log("Versión nueva detectada. Se aplicará cuando la app no esté en uso.");
          pendingUpdate = true;
        }
      } catch (err) {}
    };

    const handleVisibilityChange = () => {
      // Si el usuario oculta la app (cambia de pestaña, bloquea tlf) y hay una actualización
      if (document.visibilityState === 'hidden' && pendingUpdate) {
        // SEGURIDAD: No recargar si estamos en medio de un intercambio vivo
        if (window.location.pathname.includes('/swap')) {
          console.log("Actualización pendiente pospuesta por sesión activa.");
          return;
        }
        
        window.location.reload();
      } 
      
      // Al volver a la app, también aprovechamos para chequear
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    const interval = setInterval(checkVersion, 300000); // 5 min
    document.addEventListener('visibilitychange', handleVisibilityChange);
    checkVersion();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
