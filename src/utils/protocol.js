import { ALBUM_MANIFEST, ENTITY_TYPES } from '../data/albumManifest';

// Helper to flatten the manifest into a stable ordered list of IDs with types
const getAllStickerIds = () => {
    let ids = [];
    ALBUM_MANIFEST.forEach(group => {
        group.sections.forEach(section => {
            if (section.items && Array.isArray(section.items)) {
                section.items.forEach(item => {
                    ids.push({
                        id: item.id || `${section.country}-${item.number}`,
                        type: item.itemType || section.type
                    });
                });
            } else if (section.type === ENTITY_TYPES.SQUAD) {
                // Legacy fallback
                for (let i = 0; i < section.count; i++) {
                    const num = section.startNumber + i;
                    ids.push({
                        id: `${section.country}-${num}`,
                        type: ENTITY_TYPES.SQUAD
                    });
                }
            } else if (section.type === ENTITY_TYPES.VENUE && section.id) {
                // Legacy fallback
                ids.push({
                    id: section.id,
                    type: ENTITY_TYPES.VENUE
                });
            }
        });
    });
    return ids;
};

const ALL_IDS = getAllStickerIds();

// Generate a 4-character structure hash based on manifest (V6.6: full string iteration)
const generateStructureHash = () => {
    const length = ALL_IDS.length;

    // V6.6: Iterate over ENTIRE string of both ID and TYPE for collision resistance
    const checksum = ALL_IDS.reduce((acc, item, idx) => {
        // Weight ID: sum all character codes weighted by position
        const idWeight = item.id.split('').reduce((sum, char, charIdx) => {
            return sum + char.charCodeAt(0) * (idx + 1) * (charIdx + 1);
        }, 0);

        // Weight TYPE: sum all character codes weighted by position
        const typeWeight = item.type.split('').reduce((sum, char, charIdx) => {
            return sum + char.charCodeAt(0) * (idx + 10) * (charIdx + 1);
        }, 0);

        return acc + idWeight + typeWeight;
    }, length * 1000);

    // Convert to base36 and take last 4 chars
    const hash = Math.abs(checksum).toString(36).slice(-4).toUpperCase();
    return hash.padStart(4, '0');
};

const STRUCTURE_HASH = generateStructureHash();

// Convert array of booleans to Base64 string (Binary Compression)
const bitsToBase64 = (bits) => {
    const bytes = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        if (bits[i]) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            bytes[byteIndex] |= (1 << bitIndex);
        }
    }
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Convert Base64 string back to array of booleans
const base64ToBits = (base64Str, totalLength) => {
    try {
        const binary = atob(base64Str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const bits = [];
        for (let i = 0; i < totalLength; i++) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            if (byteIndex < bytes.length) {
                bits.push((bytes[byteIndex] & (1 << bitIndex)) !== 0);
            } else {
                bits.push(false);
            }
        }
        return bits;
    } catch (e) {
        console.error("Failed to decode bits:", e);
        return Array(totalLength).fill(false);
    }
};

// Parse Legacy V2 Protocol
const parseV2 = (payload) => {
    const parts = payload.split('|');
    const remoteRepeatedStr = parts.find(p => p.startsWith('R:'))?.substring(2) || '';
    const remoteMissingStr = parts.find(p => p.startsWith('M:'))?.substring(2) || '';

    return {
        v: 2,
        repeated: remoteRepeatedStr ? remoteRepeatedStr.split(',').filter(Boolean) : [],
        missing: remoteMissingStr ? remoteMissingStr.split(',').filter(Boolean) : []
    };
};

// Parse Legacy V3 Protocol (no hash)
const parseV3 = (parts) => {
    const repeatedEncoded = parts[1];
    const missingEncoded = parts[2];
    const totalItems = ALL_IDS.length;

    const repeatedBits = base64ToBits(repeatedEncoded, totalItems);
    const missingBits = base64ToBits(missingEncoded, totalItems);

    const repeatedIds = [];
    const missingIds = [];

    ALL_IDS.forEach((item, index) => {
        if (repeatedBits[index]) repeatedIds.push(item.id);
        if (missingBits[index]) missingIds.push(item.id);
    });

    return { v: 3, repeated: repeatedIds, missing: missingIds };
};

export const Protocol = {
    VERSION: 4,

    // Get ordered list of all IDs (backward compatible - returns just IDs)
    getAllIds: () => ALL_IDS.map(item => item.id),

    // Get total count for validation
    getTotalCount: () => ALL_IDS.length,

    // Get current structure hash
    getStructureHash: () => STRUCTURE_HASH,

    // Validate that an ID exists in the manifest
    isValidId: (id) => ALL_IDS.some(item => item.id === id),

    // Generate V4 Payload: "v4|hash|<RepeatedMask>|<MissingMask>"
    // Includes structure hash for compatibility validation
    generateV4: (inventory) => {
        const repeatedBits = ALL_IDS.map(item => (inventory[item.id] || 0) > 1);
        const missingBits = ALL_IDS.map(item => (inventory[item.id] || 0) === 0);

        return `v4|${STRUCTURE_HASH}|${bitsToBase64(repeatedBits)}|${bitsToBase64(missingBits)}`;
    },

    // Legacy V3 generator (for backward compatibility tests)
    generateV3: (inventory) => {
        const repeatedBits = ALL_IDS.map(item => (inventory[item.id] || 0) > 1);
        const missingBits = ALL_IDS.map(item => (inventory[item.id] || 0) === 0);

        return `v3|${bitsToBase64(repeatedBits)}|${bitsToBase64(missingBits)}`;
    },

    // Parse Any Protocol Version (V2, V3, or V4)
    parse: (rawPayload) => {
        // Límite de 10KB
        if (!rawPayload || typeof rawPayload !== 'string' || rawPayload.length > 10240) {
            console.warn('[Protocol] Invalid or oversized payload');
            return null;
        }

        try {
            let payload = rawPayload;

            // Try to decode if it looks like Base64 (legacy V6.0-6.2 format)
            if (!payload.startsWith('v2|') && !payload.startsWith('v3|') && !payload.startsWith('v4|')) {
                try {
                    payload = atob(rawPayload);
                } catch {
                    // Not Base64, use as-is
                }
            }

            // V4 Protocol with structure hash
            if (payload.startsWith('v4|')) {
                const parts = payload.split('|');
                if (parts.length < 4) throw new Error("Invalid V4 Payload");

                const remoteHash = parts[1];
                const repeatedEncoded = parts[2];
                const missingEncoded = parts[3];

                // Validate structure hash
                if (remoteHash !== STRUCTURE_HASH) {
                    return {
                        v: 4,
                        error: 'INCOMPATIBLE_STRUCTURE',
                        message: `Incompatible Album Structure. Expected ${STRUCTURE_HASH}, got ${remoteHash}`
                    };
                }

                const totalItems = ALL_IDS.length;
                const repeatedBits = base64ToBits(repeatedEncoded, totalItems);
                const missingBits = base64ToBits(missingEncoded, totalItems);

                const repeatedIds = [];
                const missingIds = [];

                ALL_IDS.forEach((item, index) => {
                    if (repeatedBits[index]) repeatedIds.push(item.id);
                    if (missingBits[index]) missingIds.push(item.id);
                });

                return { v: 4, repeated: repeatedIds, missing: missingIds, hash: remoteHash };
            }

            // V3 Binary Protocol (legacy, no hash)
            if (payload.startsWith('v3|')) {
                const parts = payload.split('|');
                if (parts.length < 3) throw new Error("Invalid V3 Payload");
                return parseV3(parts);
            }

            // V2 Legacy Protocol
            if (payload.startsWith('v2|')) {
                return parseV2(payload);
            }

            throw new Error("Unknown Protocol Version");
        } catch (e) {
            console.error("Protocol Parse Error:", e);
            return null;
        }
    },

    // Calculate byte size of V4 payload
    getPayloadSize: (inventory) => {
        const payload = Protocol.generateV4(inventory);
        return payload.length;
    }
};
