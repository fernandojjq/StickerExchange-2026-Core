// SWAP-26 ALBUM MANIFEST V6.3
// All identifiers are fully abstract - ZERO trademarks
// Country codes follow ISO 3166-1 alpha-3 standard

import { COUNTRIES } from './countries';

export const ENTITY_TYPES = {
    HEADER: 'HEADER',
    SQUAD: 'SQUAD',
    VENUE: 'VENUE',
    LEGEND: 'LEGEND'
};

// Helper para generar grupos (A-L para 48 equipos, asumiendo 4 equipos por grupo como es tradicional)
// Aunque en 2026 serán 12 grupos de 4.
const GROUP_COLORS = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7'
];

// Generar secciones especiales primero
const specialSections = [
    {
        id: 'specials',
        title: 'INTL COMPETITION 2026',
        color: '#d946ef',
        sections: [
            {
                type: ENTITY_TYPES.HEADER,
                country: 'FWC',
                items: [
                    { id: 'FWC-00', number: '00', itemType: 'HEADER', label: 'Commemorative Logo' }
                ]
            },
            {
                type: ENTITY_TYPES.HEADER,
                country: 'FWC',
                items: Array.from({ length: 5 }, (_, i) => ({
                    id: `FWC-0${i + 1}`, number: `0${i + 1}`, itemType: 'HEADER', label: 'Tournament Emblem'
                }))
            },
            {
                type: ENTITY_TYPES.VENUE,
                country: 'FWC',
                items: Array.from({ length: 3 }, (_, i) => ({
                    id: `FWC-0${i + 6}`, number: `0${i + 6}`, itemType: 'VENUE', label: 'Host Cities'
                }))
            },
            {
                type: ENTITY_TYPES.LEGEND,
                country: 'FWC',
                items: Array.from({ length: 11 }, (_, i) => ({
                    id: `FWC-${String(i + 9).padStart(2, '0')}`, number: String(i + 9).padStart(2, '0'), itemType: 'LEGEND', label: 'History & Mascot'
                }))
            }
        ]
    }
];

// Generar secciones de equipos
const teamSections = [];
const TEAMS_PER_GROUP = 4;

for (let i = 0; i < COUNTRIES.length; i += TEAMS_PER_GROUP) {
    const groupIndex = i / TEAMS_PER_GROUP;
    const groupName = `GROUP ${String.fromCharCode(65 + groupIndex)}`; // A, B, C...
    const groupTeams = COUNTRIES.slice(i, i + TEAMS_PER_GROUP);

    const sections = groupTeams.map((country, idx) => {
        const teamItems = [];
        // 01 = Badge
        teamItems.push({ id: `${country}-01`, number: '01', itemType: 'HEADER', label: `${country} Badge` });
        
        // 02-12 = Players
        for(let p=2; p<=12; p++) {
            teamItems.push({ id: `${country}-${String(p).padStart(2, '0')}`, number: String(p).padStart(2, '0'), itemType: 'SQUAD' });
        }
        
        // 13 = Collection Photo
        teamItems.push({ id: `${country}-13`, number: '13', itemType: 'HEADER', label: `${country} Photo` });
        
        // 14-20 = Players
        for(let p=14; p<=20; p++) {
            teamItems.push({ id: `${country}-${String(p).padStart(2, '0')}`, number: String(p).padStart(2, '0'), itemType: 'SQUAD' });
        }

        return {
            type: ENTITY_TYPES.SQUAD,
            country: country,
            items: teamItems
        };
    });

    teamSections.push({
        id: `group_${groupName.toLowerCase().replace(' ', '_')}`,
        title: groupName,
        color: GROUP_COLORS[groupIndex % GROUP_COLORS.length],
        sections: sections
    });
}

// Generar Extras y Coca Cola
const promoSections = [
    {
        id: 'extras',
        title: 'EXTRA STICKERS',
        color: '#fbbf24',
        sections: [
            {
                type: ENTITY_TYPES.LEGEND,
                country: 'EXT',
                items: Array.from({ length: 20 }, (_, i) => ({
                    id: `EXT-${String(i + 1).padStart(2, '0')}`, number: `E${i + 1}`, itemType: 'LEGEND', label: 'Extra Sticker'
                }))
            }
        ]
    },
    {
        id: 'promo',
        title: 'PARTNER COLLECTION',
        color: '#e11d48',
        sections: [
            {
                type: ENTITY_TYPES.LEGEND,
                country: 'CC',
                items: Array.from({ length: 14 }, (_, i) => ({
                    id: `CC-${String(i + 1).padStart(2, '0')}`, number: `C${i + 1}`, itemType: 'LEGEND', label: 'Promotion Item'
                }))
            }
        ]
    }
];

export const ALBUM_MANIFEST = [...specialSections, ...teamSections, ...promoSections];

