// ============================================================================
// ARCHIVO: src/hooks/useLanguage.js
// VERSIÓN: 1.0 - Hook de gestión de idiomas
// ============================================================================

import { useState, useEffect } from 'react';
import { translations } from '../data/translations';

export const useLanguage = () => {
    const [language, setLanguage] = useState(() => {
        // 1. Intentar leer de localStorage
        const stored = localStorage.getItem('swap26_lang');
        if (stored) return stored;

        // 2. Intentar detectar del navegador
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('en')) return 'en';
        
        // 3. Por defecto Español
        return 'es';
    });

    useEffect(() => {
        localStorage.setItem('swap26_lang', language);
        // Actualizar el atributo lang del HTML para accesibilidad y SEO
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => {
        const keys = Object.keys(translations);
        const currentIndex = keys.indexOf(language);
        const nextIndex = (currentIndex + 1) % keys.length;
        setLanguage(keys[nextIndex]);
    };

    return {
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language]
    };
};
