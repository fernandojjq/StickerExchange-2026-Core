import { useEffect } from 'react';

export const useVersionCheck = () => {
  useEffect(() => {
    // Solo comprobamos en el servidor de producción (no mientras desarrollas)
    if (import.meta.env.DEV) return;

    let currentVersion = null;

    const checkVersion = async () => {
      try {
        // 1. Evitamos bucles: No recargar si ya lo hicimos hace menos de 10 segundos
        const lastReload = localStorage.getItem('swap26_last_reload');
        const now = Date.now();
        if (lastReload && (now - parseInt(lastReload)) < 10000) return;

        const response = await fetch('/version.json?t=' + now);
        const contentType = response.headers.get("content-type");
        
        // 2. Solo procesamos si la respuesta es OK y es un JSON real (evita errores con 404 redireccionados)
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const savedVersion = localStorage.getItem('swap26_version');
          
          if (!currentVersion) {
            // Es el primer chequeo de esta sesión en memoria
            currentVersion = data.version;
            
            // Si la versión guardada en el navegador es distinta a la del servidor, actualizamos
            if (savedVersion && savedVersion !== data.version) {
                console.log("Nueva versión detectada al inicio. Actualizando...");
                localStorage.setItem('swap26_version', data.version);
                localStorage.setItem('swap26_last_reload', Date.now().toString());
                window.location.reload();
                return;
            }
            
            // Guardar para futuras aperturas
            localStorage.setItem('swap26_version', data.version);
            
          } else if (currentVersion !== data.version) {
            // Cambio detectado en "vivo" (app abierta)
            console.log("Nueva versión detectada en vivo. Actualizando...");
            localStorage.setItem('swap26_version', data.version);
            localStorage.setItem('swap26_last_reload', Date.now().toString());
            window.location.reload();
          }
        }
      } catch (err) {
        // Ignoramos errores de red o parsing
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
