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
          
          if (!currentVersion) {
            // Guardamos la versión la primera vez que comprobamos
            currentVersion = data.version;
          } else if (currentVersion !== data.version) {
            // ¡El desarrollador subió una nueva versión! Forzamos recarga.
            console.log("Nueva versión detectada. Recargando...");
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
