// ============================================================================
// ARCHIVO: src/data/translations.js
// VERSIÓN: 2.0 - Sistema Multi-idioma Extendido (ES, EN, PT, FR, DE)
// ============================================================================

export const translations = {
    es: {
        common: { loading: "Cargando...", understand: "¡Entendido!" },
        nav: { album: "Álbum", swap: "Intercambio", profile: "Mi ID" },
        album: {
            title: "SWAP-26",
            subtitle: "Inventario Digital",
            search_placeholder: "Buscar...",
            filter_all: "TODO",
            filter_missing: "FALTANTES",
            filter_repeated: "REPETIDAS",
            group_all: "TODOS LOS GRUPOS",
            type_all: "TODOS",
            type_crests: "ESCUDOS",
            type_promo: "PROMO",
            type_extras: "EXTRAS",
            type_players: "JUGADORES",
            stats_stickers: "Stickers",
            help_title: "Guía de Ayuda",
            tip_title: "¡Buen comienzo!",
            tip_desc: "Toca el botón + para añadir repetidas y el - para quitarlas."
        },
        guide: {
            manual: "Manual de Usuario",
            album: {
                title: "Guía del Álbum",
                steps: [
                    { t: "Marcar Cromos", d: "Toca cualquier cromo para marcarlo como recolectado." },
                    { t: "Gestión de Repetidas", d: "Usa el botón (+) para añadir repetidas y el (-) para quitarlas." },
                    { t: "Filtros Rápidos", d: "Filtra por 'Faltantes' para ver qué te falta." }
                ]
            }
        },
        profile: {
            title: "MI ID",
            subtitle: "Perfil del Coleccionista",
            share_card: "Generar Tarjeta",
            reset_data: "Borrar Datos"
        }
    },
    en: {
        common: { loading: "Loading...", understand: "Got it!" },
        nav: { album: "Album", swap: "Swap", profile: "My ID" },
        album: {
            title: "SWAP-26",
            subtitle: "Digital Inventory",
            search_placeholder: "Search...",
            filter_all: "ALL",
            filter_missing: "MISSING",
            filter_repeated: "REPEATED",
            group_all: "ALL GROUPS",
            type_all: "ALL",
            type_crests: "CRESTS",
            type_promo: "PROMO",
            type_extras: "EXTRAS",
            type_players: "PLAYERS",
            stats_stickers: "Stickers",
            help_title: "Help Guide",
            tip_title: "Great start!",
            tip_desc: "Tap the + button to add duplicates and the - to remove them."
        },
        guide: {
            manual: "User Manual",
            album: {
                title: "Album Guide",
                steps: [
                    { t: "Mark Stickers", d: "Tap any sticker to mark it as collected." },
                    { t: "Duplicate Management", d: "Use the (+) button to add duplicates and (-) to remove them." },
                    { t: "Quick Filters", d: "Filter by 'Missing' to see what you need." }
                ]
            }
        },
        profile: {
            title: "MY ID",
            subtitle: "Collector Profile",
            share_card: "Generate Card",
            reset_data: "Clear Data"
        }
    },
    pt: {
        common: { loading: "Carregando...", understand: "Entendi!" },
        nav: { album: "Álbum", swap: "Troca", profile: "Meu ID" },
        album: {
            title: "SWAP-26",
            subtitle: "Inventário Digital",
            search_placeholder: "Buscar...",
            filter_all: "TUDO",
            filter_missing: "FALTANDO",
            filter_repeated: "REPETIDAS",
            group_all: "TODOS OS GRUPOS",
            type_all: "TODOS",
            type_crests: "ESCUDOS",
            type_promo: "PROMO",
            type_extras: "EXTRAS",
            type_players: "JOGADORES",
            stats_stickers: "Figurinhas",
            help_title: "Guia de Ajuda",
            tip_title: "Bom começo!",
            tip_desc: "Toque no botão + para adicionar repetidas e no - para remover."
        },
        guide: {
            manual: "Manual do Usuário",
            album: {
                title: "Guia do Álbum",
                steps: [
                    { t: "Marcar Figurinhas", d: "Toque em qualquer figurinha para marcar como coletada." },
                    { t: "Gestão de Repetidas", d: "Use o botão (+) para adicionar e (-) para remover." },
                    { t: "Filtros Rápidos", d: "Filtre por 'Faltando' para ver o que precisa." }
                ]
            }
        },
        profile: {
            title: "MEU ID",
            subtitle: "Perfil do Colecionador",
            share_card: "Gerar Cartão",
            reset_data: "Limpar Dados"
        }
    },
    fr: {
        common: { loading: "Chargement...", understand: "Compris !" },
        nav: { album: "Album", swap: "Échange", profile: "Mon ID" },
        album: {
            title: "SWAP-26",
            subtitle: "Inventaire Numérique",
            search_placeholder: "Chercher...",
            filter_all: "TOUT",
            filter_missing: "MANQUANTS",
            filter_repeated: "DOUBLES",
            group_all: "TOUS LES GROUPES",
            type_all: "TOUT",
            type_crests: "ÉCUSSONS",
            type_promo: "PROMO",
            type_extras: "EXTRAS",
            type_players: "JOUEURS",
            stats_stickers: "Stickers",
            help_title: "Guide d'aide",
            tip_title: "Bon début !",
            tip_desc: "Appuyez sur + pour ajouter des doubles et sur - pour les retirer."
        },
        guide: {
            manual: "Manuel de l'utilisateur",
            album: {
                title: "Guide de l'album",
                steps: [
                    { t: "Marquer les stickers", d: "Appuyez sur un sticker pour le marquer comme collecté." },
                    { t: "Gestion des doubles", d: "Utilisez (+) pour ajouter et (-) pour retirer." },
                    { t: "Filtres rapides", d: "Filtrez par 'Manquants' pour voir vos besoins." }
                ]
            }
        },
        profile: {
            title: "MON ID",
            subtitle: "Profil du Collectionneur",
            share_card: "Générer Carte",
            reset_data: "Effacer Données"
        }
    },
    de: {
        common: { loading: "Laden...", understand: "Verstanden!" },
        nav: { album: "Album", swap: "Tausch", profile: "Mein ID" },
        album: {
            title: "SWAP-26",
            subtitle: "Digitales Inventar",
            search_placeholder: "Suchen...",
            filter_all: "ALLE",
            filter_missing: "FEHLEND",
            filter_repeated: "DOPPELTE",
            group_all: "ALLE GRUPPEN",
            type_all: "ALLE",
            type_crests: "WAPPEN",
            type_promo: "PROMO",
            type_extras: "EXTRAS",
            type_players: "SPIELER",
            stats_stickers: "Sticker",
            help_title: "Hilfe-Leitfaden",
            tip_title: "Guter Start!",
            tip_desc: "Drücken Sie +, um Doppelte hinzuzufügen, und -, um sie zu entfernen."
        },
        guide: {
            manual: "Benutzerhandbuch",
            album: {
                title: "Album-Anleitung",
                steps: [
                    { t: "Sticker markieren", d: "Tippen Sie auf einen Sticker, um ihn als gesammelt zu markieren." },
                    { t: "Doppelte verwalten", d: "Nutzen Sie (+) zum Hinzufügen und (-) zum Entfernen." },
                    { t: "Schnellfilter", d: "Filtern Sie nach 'Fehlend', um zu sehen, was Sie brauchen." }
                ]
            }
        },
        profile: {
            title: "MEIN ID",
            subtitle: "Sammlerprofil",
            share_card: "Karte erstellen",
            reset_data: "Daten löschen"
        }
    }
};
