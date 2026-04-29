import React from 'react';

// Generador de colores determinístico basado en código ISO
const stringToColors = (str) => {
    let hash1 = 0;
    let hash2 = 0;

    for (let i = 0; i < str.length; i++) {
        hash1 = str.charCodeAt(i) + ((hash1 << 5) - hash1);
        hash2 = str.charCodeAt(i) + ((hash2 << 7) - hash2);
    }

    const color1 = '#' + (hash1 & 0x00FFFFFF).toString(16).padStart(6, '0');
    const color2 = '#' + (hash2 & 0x00FFFFFF).toString(16).padStart(6, '0');

    return { primary: color1, secondary: color2 };
};

// Generar un patrón geométrico abstracto único por código
const getPattern = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 3) - hash);
    }
    return Math.abs(hash) % 6; // 6 patrones diferentes
};

export const Flag = React.memo(({ iso, size = "md", className = "" }) => {
    const colors = stringToColors(iso || "UNK");
    const pattern = getPattern(iso || "UNK");

    const sizeClasses = {
        sm: "w-8 h-5",
        md: "w-12 h-8",
        lg: "w-20 h-14"
    };

    const textSizes = {
        sm: "text-[8px]",
        md: "text-[10px]",
        lg: "text-xs"
    };

    return (
        <div
            className={`${sizeClasses[size] || sizeClasses.md} ${className} rounded shadow-sm overflow-hidden relative`}
            style={{ backgroundColor: colors.primary }}
        >
            {/* Patrón geométrico abstracto - NO es una bandera */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 48 32"
                preserveAspectRatio="none"
            >
                {pattern === 0 && (
                    // Patrón: Diagonal
                    <path d="M0 0 L48 32 L48 0 Z" fill={colors.secondary} opacity="0.6" />
                )}
                {pattern === 1 && (
                    // Patrón: Círculo central
                    <circle cx="24" cy="16" r="10" fill={colors.secondary} opacity="0.6" />
                )}
                {pattern === 2 && (
                    // Patrón: Banda horizontal
                    <rect x="0" y="10" width="48" height="12" fill={colors.secondary} opacity="0.6" />
                )}
                {pattern === 3 && (
                    // Patrón: Triángulo
                    <polygon points="24,4 44,28 4,28" fill={colors.secondary} opacity="0.6" />
                )}
                {pattern === 4 && (
                    // Patrón: Esquina
                    <rect x="0" y="0" width="20" height="32" fill={colors.secondary} opacity="0.6" />
                )}
                {pattern === 5 && (
                    // Patrón: Rombo
                    <polygon points="24,2 44,16 24,30 4,16" fill={colors.secondary} opacity="0.5" />
                )}
            </svg>

            {/* Código ISO superpuesto */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`${textSizes[size]} font-black text-white drop-shadow-md tracking-wider`}>
                    {iso}
                </span>
            </div>
        </div>
    );
});
