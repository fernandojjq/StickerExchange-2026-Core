import { useEffect, useState } from 'react';

export const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Si estamos en entorno de desarrollo local, no verificar versiones
    if (import.meta.env.DEV) return;

    let sessionVersion = null;

    const checkVersion = async () => {
      try {
        // Añadimos un timestamp para evitar que la red o Cloudflare nos devuelva un JSON cacheado
        const response = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        
        // La primera vez que se carga la app, guardamos qué versión tiene
        if (!sessionVersion) {
          sessionVersion = data.version;
          return;
        }

        // Si la versión del servidor es diferente a la nuestra, hay actualización
        if (data.version !== sessionVersion) {
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Silencioso, si falla la red no pasa nada
      }
    };

    // Verificar cada vez que el usuario vuelve a la app (por ejemplo, después de minimizarla)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    // Verificar cada 10 minutos (600000 ms)
    const interval = setInterval(checkVersion, 600000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificación inicial con un pequeño retraso para no bloquear la carga inicial
    setTimeout(checkVersion, 5000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return updateAvailable;
};
