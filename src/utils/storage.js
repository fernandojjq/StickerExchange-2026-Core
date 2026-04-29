// ============================================================================
// ARCHIVO: src/utils/storage.js
// VERSIÓN: 12.0 - Fixed anti-patterns y optimizaciones de rendimiento
// ============================================================================

const CURRENT_VERSION = 4;
const KEY_PREFIX = 'swap26';
const KEY_VERSION = `${KEY_PREFIX}_version`;
const KEY_USER = `${KEY_PREFIX}_user`;
const KEY_INVENTORY = `${KEY_PREFIX}_inventory`;
const KEY_HISTORY = `${KEY_PREFIX}_history`;

const MAX_HISTORY_ENTRIES = 10;

// ✅ CORREGIDO: Timer fuera del objeto para evitar anti-patrón
let _debounceTimer = null;

// Migración de versiones anteriores
const migrateIfNeeded = () => {
    try {
        const storedVersion = parseInt(localStorage.getItem(KEY_VERSION) || '0', 10);

        if (storedVersion < CURRENT_VERSION) {
            const oldKeys = [
                'swap26_social_v2_quantities_user',
                'swap26_social_v2_quantities_inventory',
                'swap26_user',
                'swap26_inventory'
            ];

            let migratedUser = null;
            let migratedInventory = null;

            for (const oldKey of oldKeys) {
                const data = localStorage.getItem(oldKey);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (oldKey.includes('user') && !migratedUser) {
                            migratedUser = parsed;
                        }
                        if (oldKey.includes('inventory') && !migratedInventory) {
                            migratedInventory = parsed;
                        }
                    } catch {
                        // Ignorar datos corruptos
                    }
                }
            }

            if (migratedUser) {
                localStorage.setItem(KEY_USER, JSON.stringify(migratedUser));
            }
            if (migratedInventory) {
                localStorage.setItem(KEY_INVENTORY, JSON.stringify(migratedInventory));
            }

            oldKeys.forEach(key => localStorage.removeItem(key));
            localStorage.setItem(KEY_VERSION, CURRENT_VERSION.toString());

            console.log(`Migrated from v${storedVersion} to v${CURRENT_VERSION}`);
        }
    } catch (e) {
        console.error('Migration failed:', e);
    }
};

migrateIfNeeded();

export const storage = {
    getUser: () => {
        try {
            const data = localStorage.getItem(KEY_USER);
            return data ? JSON.parse(data) : { name: 'Coleccionista', location: 'Unknown' };
        } catch {
            return { name: 'Coleccionista' };
        }
    },

    saveUser: (user) => {
        try {
            localStorage.setItem(KEY_USER, JSON.stringify(user));
        } catch (e) {
            console.error('Failed to save user:', e);
        }
    },

    getInventory: () => {
        try {
            const data = localStorage.getItem(KEY_INVENTORY);
            if (!data) return {};

            const parsed = JSON.parse(data);

            if (typeof parsed !== 'object' || parsed === null) {
                return {};
            }

            const cleaned = {};
            for (const [key, value] of Object.entries(parsed)) {
                if (typeof value === 'number' && value >= 0) {
                    cleaned[key] = value;
                }
            }

            return cleaned;
        } catch {
            return {};
        }
    },

    // ✅ CORREGIDO: Usar variable fuera del objeto para debounce
    saveInventory: (inventory) => {
        if (_debounceTimer) clearTimeout(_debounceTimer);
        
        _debounceTimer = setTimeout(() => {
            try {
                localStorage.setItem(KEY_INVENTORY, JSON.stringify(inventory));
            } catch (e) {
                console.error('Failed to save inventory:', e);
            }
        }, 1000);
    },

    increment: (inventory, id) => {
        const current = inventory[id] || 0;
        return { ...inventory, [id]: current + 1 };
    },

    decrement: (inventory, id) => {
        const current = inventory[id] || 0;
        if (current <= 0) return inventory;
        return { ...inventory, [id]: current - 1 };
    },

    // =========================================================================
    // HISTORIAL DE TRANSACCIONES
    // =========================================================================

    getHistory: () => {
        try {
            const data = localStorage.getItem(KEY_HISTORY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    },

    addToHistory: (transaction) => {
        try {
            const history = storage.getHistory();

            // Prevenir duplicados en los últimos 2 segundos
            const twoSecondsAgo = Date.now() - 2000;
            const recentDuplicate = history.find(h => {
                const entryTime = new Date(h.timestamp).getTime();
                return entryTime > twoSecondsAgo &&
                    h.type === transaction.type &&
                    JSON.stringify(h.received) === JSON.stringify(transaction.received) &&
                    JSON.stringify(h.given) === JSON.stringify(transaction.given);
            });

            if (recentDuplicate) {
                console.warn('[Storage] Duplicate transaction prevented');
                return recentDuplicate;
            }

            const entry = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                timestamp: new Date().toISOString(),
                type: transaction.type || 'offline',
                received: transaction.received || [],
                given: transaction.given || [],
                receivedCount: (transaction.received || []).length,
                givenCount: (transaction.given || []).length,
                ...(transaction.roomCode && { roomCode: transaction.roomCode })
            };

            const newHistory = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
            localStorage.setItem(KEY_HISTORY, JSON.stringify(newHistory));

            return entry;
        } catch (e) {
            console.error('Failed to save history:', e);
            return null;
        }
    },

    clearHistory: () => {
        try {
            localStorage.removeItem(KEY_HISTORY);
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    },

    // =========================================================================
    // BACKUP Y RESTORE
    // =========================================================================

    clear: () => {
        localStorage.removeItem(KEY_USER);
        localStorage.removeItem(KEY_INVENTORY);
        localStorage.removeItem(KEY_HISTORY);
        localStorage.setItem(KEY_VERSION, CURRENT_VERSION.toString());
    },

    getFullBackup: () => {
        try {
            const user = storage.getUser();
            const inventory = storage.getInventory();
            const history = storage.getHistory();

            return JSON.stringify({
                version: CURRENT_VERSION,
                timestamp: new Date().toISOString(),
                app: 'swap26',
                user,
                inventory,
                history
            }, null, 2);
        } catch (e) {
            console.error('Backup failed:', e);
            return null;
        }
    },

    restoreBackup: (jsonString) => {
        try {
            const data = JSON.parse(jsonString);

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid backup format: not an object');
            }

            if (!data.inventory || typeof data.inventory !== 'object') {
                throw new Error('Invalid backup format: missing inventory');
            }

            if (data.user) {
                storage.saveUser(data.user);
            }

            storage.saveInventory(data.inventory);

            if (data.history && Array.isArray(data.history)) {
                localStorage.setItem(KEY_HISTORY, JSON.stringify(data.history));
            }

            localStorage.setItem(KEY_VERSION, CURRENT_VERSION.toString());

            return true;
        } catch (e) {
            console.error('Restore failed:', e);
            return false;
        }
    },

    getStorageStats: () => {
        try {
            const inventorySize = (localStorage.getItem(KEY_INVENTORY) || '').length;
            const userSize = (localStorage.getItem(KEY_USER) || '').length;
            const historySize = (localStorage.getItem(KEY_HISTORY) || '').length;

            return {
                inventoryBytes: inventorySize,
                userBytes: userSize,
                historyBytes: historySize,
                totalBytes: inventorySize + userSize + historySize,
                estimatedQuota: 5 * 1024 * 1024,
                usage: ((inventorySize + userSize + historySize) / (5 * 1024 * 1024) * 100).toFixed(2) + '%'
            };
        } catch {
            return null;
        }
    },

    // Helper para marcar stickers marcados como "urgentes" o últimos
    isUrgent: (id) => {
        return false;
    }
};
