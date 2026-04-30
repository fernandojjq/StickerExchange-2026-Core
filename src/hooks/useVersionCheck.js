import { useEffect } from 'react';

export const useVersionCheck = () => {
  useEffect(() => {
    // Solo comprobamos en el servidor de producción (no mientras desarrollas)
    if (import.meta.env.DEV) return;

    const checkVersion = async () => {
      try {
        // 1. Evitamos bucles: No recargar si ya lo hicimos hace menos de 10 segundos
        const lastReload = localStorage.getItem('swap26_last_reload');
        const now = Date.now();
        if (lastReload && (now - parseInt(lastReload)) < 10000) return;

        const response = await fetch('/version.json?t=' + now);
        const contentType = response.headers.get("content-type");
        
        // 2. Solo procesamos si la respuesta es OK y es un JSON real
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const buildVersion = window.APP_VERSION;
          
          // La fuente de verdad es la comparación entre lo que el HTML dice ser (APP_VERSION)
          // y lo que el servidor dice que es la última versión (data.version)
          if (buildVersion && data.version !== buildVersion) {
              console.log(`Nueva versión detectada (${buildVersion} -> ${data.version}). Actualizando...`);
              localStorage.setItem('swap26_last_reload', Date.now().toString());
              window.location.reload();
          }
        }
      } catch (err) {
        // Ignoramos errores de red
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
