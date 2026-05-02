import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { useLanguage } from '../context/LanguageContext';

export const UpdateBanner = () => {
  const updateAvailable = useVersionCheck();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Si hay actualización y no la hemos ocultado en esta sesión
    if (updateAvailable) {
      const dismissed = sessionStorage.getItem('swap26_update_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    // Recargamos limpiando caché
    window.location.reload(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Ocultar solo durante esta sesión
    sessionStorage.setItem('swap26_update_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-36 left-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between border border-indigo-500/50 backdrop-blur-sm bg-opacity-95">
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide">
            {t.update?.new_version || "¡Nueva versión disponible!"}
          </span>
          <span className="text-xs text-indigo-200 mt-0.5">
            {t.update?.desc || "Mejoras y nuevas funciones."}
          </span>
        </div>
        
        <div className="flex items-center space-x-3 ml-4">
          <button 
            onClick={handleUpdate}
            className="flex items-center space-x-1.5 bg-white text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
          >
            <Icons.Refresh className="w-3.5 h-3.5" />
            <span>{t.update?.btn || "Actualizar"}</span>
          </button>
          
          <button 
            onClick={handleDismiss}
            className="p-1.5 text-indigo-200 hover:text-white rounded-full bg-indigo-700/50 active:bg-indigo-800 transition-colors"
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
