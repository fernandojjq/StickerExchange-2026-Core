import { useEffect } from 'react';

export const useVersionCheck = () => {
  useEffect(() => {
    // Solo comprobamos en el servidor de producción (no mientras desarrollas)
    if (import.meta.env.DEV) return;

    let currentVersion = null;

    const checkVersion = async () => {
      try {
        // Evitamos la caché añadiendo el timestamp a la URL
        const response = await fetch('/version.json?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          const savedVersion = localStorage.getItem('swap26_version');
          
          if (!currentVersion) {
            // Es el primer chequeo de esta sesión en memoria
            currentVersion = data.version;
            
            if (savedVersion && savedVersion !== data.version) {
                // Si la versión en disco duro es más vieja que la del servidor, recargamos
                localStorage.setItem('swap26_version', data.version);
                console.log("Versión desactualizada en inicio. Recargando...");
                window.location.reload(true);
                return;
            }
            
            // Guardar para futuras aperturas
            localStorage.setItem('swap26_version', data.version);
            
          } else if (currentVersion !== data.version) {
            // ¡El desarrollador subió una nueva versión mientras el usuario usaba la app!
            localStorage.setItem('swap26_version', data.version);
            console.log("Nueva versión detectada en vivo. Recargando...");
            window.location.reload(true);
          }
        }
      } catch (err) {
        // Si hay error (ej. sin internet), simplemente ignoramos
      }
    };

    // 1. Comprobamos ahora mismo
    checkVersion();

    // 2. Comprobamos cada minuto en segundo plano
    const interval = setInterval(checkVersion, 60000);

    // 3. Comprobamos instantáneamente cuando el usuario vuelve a abrir la app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
