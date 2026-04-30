import React from 'react';

// Mapeo de ISO 3-letras a ISO 2-letras (requerido por la librería de banderas)
const ISO3_TO_ISO2 = {
    "MEX": "mx", "RSA": "za", "KOR": "kr", "CZE": "cz",
    "CAN": "ca", "BIH": "ba", "QAT": "qa", "SUI": "ch",
    "BRA": "br", "MAR": "ma", "HAI": "ht", "SCO": "gb-sct",
    "USA": "us", "PAR": "py", "AUS": "au", "TUR": "tr",
    "GER": "de", "CUW": "cw", "CIV": "ci", "ECU": "ec",
    "NED": "nl", "JPN": "jp", "SWE": "se", "TUN": "tn",
    "BEL": "be", "EGY": "eg", "IRN": "ir", "NZL": "nz",
    "ESP": "es", "CPV": "cv", "KSA": "sa", "URU": "uy",
    "FRA": "fr", "SEN": "sn", "IRQ": "iq", "NOR": "no",
    "ARG": "ar", "ALG": "dz", "AUT": "at", "JOR": "jo",
    "POR": "pt", "COD": "cd", "UZB": "uz", "COL": "co",
    "ENG": "gb-eng", "CRO": "hr", "GHA": "gh", "PAN": "pa"
};

const stringToColors = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return '#' + (hash & 0x00FFFFFF).toString(16).padStart(6, '0');
};

export const Flag = React.memo(({ iso, size = "md", className = "", hideText = false }) => {
    const iso2 = ISO3_TO_ISO2[iso];
    const bgColor = stringToColors(iso || "UNK");

    // Iconos para secciones que no son países
    const specialIcons = {
        "FWC": "https://cdn-icons-png.flaticon.com/512/3106/3106856.png", // Trofeo
        "EXT": "https://cdn-icons-png.flaticon.com/512/1828/1828884.png", // Estrella
        "CC": "https://cdn-icons-png.flaticon.com/512/3050/3050130.png"    // Refresco
    };

    const sizeClasses = {
        xs: "w-6 h-4",
        sm: "w-10 h-7",
        md: "w-14 h-10",
        lg: "w-24 h-16"
    };

    return (
        <div
            className={`${sizeClasses[size] || sizeClasses.md} ${className} flex items-center justify-center rounded shadow-sm overflow-hidden relative group transition-transform active:scale-95 bg-slate-50`}
        >
            {iso2 ? (
                <img 
                    src={`https://flagcdn.com/w160/${iso2}.png`} 
                    alt={iso}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.backgroundColor = bgColor;
                    }}
                />
            ) : specialIcons[iso] ? (
                <img 
                    src={specialIcons[iso]} 
                    alt={iso}
                    className="w-2/3 h-2/3 object-contain"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: bgColor }}>
                    {iso}
                </div>
            )}
            
            {!hideText && (
                <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-[1px] py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] font-black text-white block text-center leading-none uppercase tracking-tighter">
                        {iso}
                    </span>
                </div>
            )}
        </div>
    );
});
