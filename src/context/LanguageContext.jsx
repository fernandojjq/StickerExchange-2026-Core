import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const stored = localStorage.getItem('swap26_lang');
        if (stored) return stored;
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('en')) return 'en';
        if (browserLang.startsWith('pt')) return 'pt';
        if (browserLang.startsWith('fr')) return 'fr';
        if (browserLang.startsWith('de')) return 'de';
        if (browserLang.startsWith('it')) return 'it';
        return 'es';
    });

    useEffect(() => {
        localStorage.setItem('swap26_lang', language);
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => {
        const keys = Object.keys(translations);
        const currentIndex = keys.indexOf(language);
        const nextIndex = (currentIndex + 1) % keys.length;
        setLanguage(keys[nextIndex]);
    };

    const value = {
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
