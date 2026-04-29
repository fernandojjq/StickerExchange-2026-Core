// ============================================================================
// ARCHIVO: src/hooks/useLiveSession.js
// VERSIÓN: 11.1 - Fix para detección de guest (stale closure)
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    ref,
    set,
    get,
    onValue,
    onDisconnect,
    remove,
    off
} from 'firebase/database';
import { database } from '../config/firebase';
import { storage } from '../utils/storage';
import { Protocol } from '../utils/protocol';

// ============================================================================
// CONSTANTES
// ============================================================================

export const SESSION_STATE = {
    IDLE: 'idle',
    CREATING: 'creating',
    WAITING: 'waiting',
    JOINING: 'joining',
    CONNECTED: 'connected',
    CONFIRMING: 'confirming',
    COMPLETED: 'completed',
    ERROR: 'error'
};

const ROOM_EXPIRY_MS = 30 * 60 * 1000;
const ROOM_CODE_REGEX = /^[A-Z2-9]{4,6}$/;

// ============================================================================
// HELPERS
// ============================================================================

const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const generateUserId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const checkUrgentStatus = (id, inventory) => {
    const parts = id.split('-');
    if (parts.length < 2) return false;

    const country = parts[0];
    const countryStickers = Protocol.getAllIds().filter(sid => sid.startsWith(country + '-'));
    const missingCount = countryStickers.filter(sid => (inventory[sid] || 0) === 0).length;

    return missingCount === 1 && (inventory[id] || 0) === 0;
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useLiveSession = () => {
    // =========================================================================
    // STATE
    // =========================================================================

    const [sessionState, setSessionState] = useState(SESSION_STATE.IDLE);
    const [roomCode, setRoomCode] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState(null);
    const [userId] = useState(() => generateUserId());

    const [matchData, setMatchData] = useState(null);
    const [mySelection, setMySelection] = useState({ give: [] });
    const [peerSelection, setPeerSelection] = useState({ give: [] });
    const [myConfirmed, setMyConfirmed] = useState(false);
    const [peerConfirmed, setPeerConfirmed] = useState(false);

    // =========================================================================
    // REFS - Para evitar stale closures
    // =========================================================================

    const sessionStateRef = useRef(sessionState);
    const isHostRef = useRef(isHost);
    const roomCodeRef = useRef(roomCode);
    const mySelectionRef = useRef(mySelection);
    const previousPeerGive = useRef([]);
    const listenerRef = useRef(null);
    const roomRefPath = useRef(null);
    const isTradingRef = useRef(false);
    const confirmedWithPeerGiveRef = useRef(null); // Snapshot de lo que peer daba cuando YO confirmé

    // Mantener refs sincronizados con state
    useEffect(() => {
        sessionStateRef.current = sessionState;
        mySelectionRef.current = mySelection;
    }, [sessionState, mySelection]);

    useEffect(() => {
        isHostRef.current = isHost;
    }, [isHost]);

    useEffect(() => {
        roomCodeRef.current = roomCode;
    }, [roomCode]);

    useEffect(() => {
        mySelectionRef.current = mySelection;
    }, [mySelection]);

    // Auto-reset my confirmation if peer changes their give selection
    useEffect(() => {
        const currentPeerGive = peerSelection.give || [];
        const prevPeerGive = previousPeerGive.current;

        // Check if peer's selection changed (different length or different items)
        const hasChanged = currentPeerGive.length !== prevPeerGive.length ||
            currentPeerGive.some((id, idx) => id !== prevPeerGive[idx]);

        if (hasChanged && prevPeerGive.length > 0 && myConfirmed) {
            console.log('[LiveSession] Peer changed selection, resetting my confirmation');
            setMyConfirmed(false);

            // Update Firebase
            if (roomRefPath.current) {
                const role = isHostRef.current ? 'host' : 'guest';
                const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);
                set(confirmedRef, false).catch(console.error);
            }
        }

        previousPeerGive.current = [...currentPeerGive];
    }, [peerSelection.give, myConfirmed]);

    // =========================================================================
    // CLEANUP
    // =========================================================================

    const cleanup = useCallback(() => {
        console.log('[LiveSession] Cleaning up...');

        if (listenerRef.current) {
            off(listenerRef.current);
            listenerRef.current = null;
        }

        roomRefPath.current = null;
        isTradingRef.current = false;
        previousPeerGive.current = [];
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // =========================================================================
    // CALCULAR MATCH
    // =========================================================================

    const calculateMatch = useCallback((peerInventoryPayload) => {
        const myInventory = storage.getInventory();
        const parsed = Protocol.parse(peerInventoryPayload);

        if (!parsed || parsed.error) {
            console.error('[LiveSession] Failed to parse peer inventory');
            return null;
        }

        const canReceive = parsed.repeated.filter(id => (myInventory[id] || 0) === 0);
        const canGive = parsed.missing.filter(id => (myInventory[id] || 0) > 1);
        const urgentItems = canReceive.filter(id => checkUrgentStatus(id, myInventory));

        const match = {
            canReceive,
            canGive,
            urgentItems,
            myInventory
        };

        console.log('[LiveSession] Match calculated:', {
            receive: canReceive.length,
            give: canGive.length,
            urgent: urgentItems.length
        });

        return match;
    }, []);

    // =========================================================================
    // EJECUTAR INTERCAMBIO
    // =========================================================================

    const executeTrade = useCallback((overridePeerGive) => {
        if (isTradingRef.current) return;
        isTradingRef.current = true;

        try {
            const selection = mySelectionRef.current;
            const peerGive = overridePeerGive || peerSelection.give || [];
            const inventory = storage.getInventory();
            const nextInv = { ...inventory };

            // What I receive = What peer is giving me (filtered by what I actually need)
            const myReceive = peerGive.filter(id => (inventory[id] || 0) === 0);

            // Add what I receive
            myReceive.forEach(id => {
                nextInv[id] = (nextInv[id] || 0) + 1;
            });

            // Remove what I give (only if I have more than 1)
            selection.give.forEach(id => {
                const current = nextInv[id] || 0;
                if (current > 1) {
                    nextInv[id] = current - 1;
                }
            });

            storage.saveInventory(nextInv);

            storage.addToHistory({
                received: myReceive,
                given: selection.give,
                type: 'live',
                roomCode: roomCodeRef.current
            });

            console.log('[LiveSession] Trade executed locally', {
                received: myReceive.length,
                given: selection.give.length
            });

            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            }

            setSessionState(SESSION_STATE.COMPLETED);

            // Auto-leave session after success
            setTimeout(() => {
                leaveSession();
            }, 3500);
        } catch (err) {
            console.error('[LiveSession] Execute trade error:', err);
            isTradingRef.current = false; // Allow retry if failed
        }
    }, [peerSelection.give]);

    // =========================================================================
    // LISTENER DE SALA - Versión corregida sin stale closures
    // =========================================================================

    const setupRoomListener = useCallback((code, asHost, initialPeerInventory = null) => {
        const roomRef = ref(database, `rooms/${code}`);
        listenerRef.current = roomRef;

        // Si el guest ya tiene el inventario del host, calcular match inmediatamente
        if (!asHost && initialPeerInventory) {
            const match = calculateMatch(initialPeerInventory);
            if (match) {
                setMatchData(match);
                // Mirror logic: only initialize what I can give
                const initialGive = [...match.canGive];
                setMySelection({ give: initialGive });

                // Sync initial selection to Firebase (Guest)
                const guestGiveRef = ref(database, `rooms/${code}/guest/give`);
                set(guestGiveRef, initialGive).catch(console.error);
            }
        }

        // Variable para trackear si ya procesamos la conexión inicial
        let hasProcessedConnection = false;

        const unsubscribe = onValue(roomRef, (snapshot) => {
            // Si el estado local ya es COMPLETED, no procesamos más cambios ni errores
            if (sessionStateRef.current === SESSION_STATE.COMPLETED) return;

            if (!snapshot.exists()) {
                console.log('[LiveSession] Room deleted');
                // Solo mostramos error si no habíamos terminado el intercambio
                if (sessionStateRef.current !== SESSION_STATE.COMPLETED) {
                    setError('La sala fue cerrada');
                    setSessionState(SESSION_STATE.ERROR);
                }
                cleanup();
                return;
            }

            const data = snapshot.val();
            console.log('[LiveSession] Room update:', {
                status: data.status,
                hasGuest: !!data.guest,
                guestConnected: data.guest?.connected,
                hostConfirmed: data.host?.confirmed,
                guestConfirmed: data.guest?.confirmed
            });

            // Verificar si el intercambio se completó
            if (data.status === 'completed') {
                if (sessionStateRef.current !== SESSION_STATE.COMPLETED) {
                    const finalPeerGive = asHost
                        ? (data.guest?.give || [])
                        : (data.host?.give || []);
                    executeTrade(finalPeerGive);
                }
                return;
            }

            // Verificar si ambos confirmaron
            if (data.host?.confirmed && data.guest?.confirmed) {
                console.log('[LiveSession] Both confirmed! Validating...');

                // Obtener lo que cada uno esperaba recibir al confirmar
                const hostExpectedToReceive = data.host?.confirmedWithPeerGive || [];
                const guestExpectedToReceive = data.guest?.confirmedWithPeerGive || [];

                // Obtener lo que cada uno está dando actualmente
                const hostCurrentlyGiving = data.host?.give || [];
                const guestCurrentlyGiving = data.guest?.give || [];

                // Validar: lo que Host espera recibir debe coincidir con lo que Guest da
                const hostExpectedStr = JSON.stringify([...hostExpectedToReceive].sort());
                const guestGivingStr = JSON.stringify([...guestCurrentlyGiving].sort());

                // Validar: lo que Guest espera recibir debe coincidir con lo que Host da
                const guestExpectedStr = JSON.stringify([...guestExpectedToReceive].sort());
                const hostGivingStr = JSON.stringify([...hostCurrentlyGiving].sort());

                const hostSideValid = hostExpectedStr === guestGivingStr;
                const guestSideValid = guestExpectedStr === hostGivingStr;

                if (!hostSideValid || !guestSideValid) {
                    console.warn('[LiveSession] Trade mismatch detected!', {
                        hostExpected: hostExpectedToReceive.length,
                        guestGiving: guestCurrentlyGiving.length,
                        guestExpected: guestExpectedToReceive.length,
                        hostGiving: hostCurrentlyGiving.length
                    });

                    // Resetear confirmaciones de ambos
                    const hostConfirmedRef = ref(database, `rooms/${code}/host/confirmed`);
                    const guestConfirmedRef = ref(database, `rooms/${code}/guest/confirmed`);

                    set(hostConfirmedRef, false).catch(console.error);
                    set(guestConfirmedRef, false).catch(console.error);

                    setMyConfirmed(false);
                    setPeerConfirmed(false);
                    setSessionState(SESSION_STATE.CONNECTED);

                    // Notificar al usuario
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                    return;
                }

                console.log('[LiveSession] Trade validated! Executing...');

                // Marcar como completado en Firebase
                const statusRef = ref(database, `rooms/${code}/status`);
                set(statusRef, 'completed').catch(console.error);

                // IMPORTANTE: Si somos Host, cancelar la eliminación automática al desconectar
                // para que el Guest tenga tiempo de leer la confirmación y datos.
                if (asHost) {
                    onDisconnect(ref(database, `rooms/${code}`)).cancel();
                }
                return;
            }

            // Lógica para HOST
            if (asHost) {
                // Detectar cuando el guest se une
                if (data.guest && data.guest.connected && !hasProcessedConnection) {
                    hasProcessedConnection = true;
                    console.log('[LiveSession] Guest joined! Processing...');

                    // Calcular match con el inventario del guest
                    const match = calculateMatch(data.guest.inventory);
                    if (match) {
                        setMatchData(match);
                        // Mirror logic: only initialize what I can give
                        const initialGive = [...match.canGive];
                        setMySelection({ give: initialGive });

                        // Sync initial selection to Firebase (Host)
                        const hostGiveRef = ref(database, `rooms/${code}/host/give`);
                        set(hostGiveRef, initialGive).catch(console.error);
                    }

                    setSessionState(SESSION_STATE.CONNECTED);
                }

                // Actualizar selección del peer (guest) - solo 'give'
                // Firebase elimina la key si el array está vacío, así que || [] es necesario
                const newPeerGive = data.guest?.give || [];
                setPeerSelection(prev => {
                    // Evitar updates redundantes
                    if (JSON.stringify(prev.give) === JSON.stringify(newPeerGive)) return prev;
                    return { give: newPeerGive };
                });

                // Actualizar confirmación del peer
                setPeerConfirmed(data.guest?.confirmed || false);

                // Detectar si guest se desconectó
                if (hasProcessedConnection && data.guest && data.guest.connected === false) {
                    setError('Tu amigo se desconectó');
                    setSessionState(SESSION_STATE.ERROR);
                }
            }
            // Lógica para GUEST
            else {
                // Actualizar selección del peer (host) - solo 'give'
                // Firebase elimina la key si el array está vacío, así que || [] es necesario
                const newPeerGive = data.host?.give || [];
                setPeerSelection(prev => {
                    // Evitar updates redundantes
                    if (JSON.stringify(prev.give) === JSON.stringify(newPeerGive)) return prev;
                    return { give: newPeerGive };
                });

                // Actualizar confirmación del peer
                setPeerConfirmed(data.host?.confirmed || false);

                // Detectar si host se desconectó
                if (data.host?.connected === false) {
                    setError('El host se desconectó');
                    setSessionState(SESSION_STATE.ERROR);
                }
            }

        }, (error) => {
            console.error('[LiveSession] Listener error:', error);
            setError('Error de conexión: ' + error.message);
            setSessionState(SESSION_STATE.ERROR);
        });

        return unsubscribe;
    }, [calculateMatch, cleanup, executeTrade]);

    // =========================================================================
    // CREAR SALA
    // =========================================================================

    const createRoom = useCallback(async () => {
        try {
            setError(null);
            setSessionState(SESSION_STATE.CREATING);

            let code;
            let attempts = 0;
            const maxAttempts = 10;

            do {
                code = generateRoomCode();
                const roomRef = ref(database, `rooms/${code}`);
                const snapshot = await get(roomRef);

                if (!snapshot.exists()) {
                    break;
                }

                const roomData = snapshot.val();
                if (roomData.createdAt && Date.now() - roomData.createdAt > ROOM_EXPIRY_MS) {
                    await remove(roomRef);
                    break;
                }

                attempts++;
            } while (attempts < maxAttempts);

            if (attempts >= maxAttempts) {
                throw new Error('No se pudo generar un código de sala único');
            }

            const myInventory = storage.getInventory();
            const myInventoryPayload = Protocol.generateV4(myInventory);

            const roomRef = ref(database, `rooms/${code}`);

            const roomData = {
                code,
                createdAt: Date.now(),
                status: 'waiting',
                host: {
                    odxid: userId,
                    inventory: myInventoryPayload,
                    give: [],  // Mirror logic: only store what host gives
                    confirmed: false,
                    connected: true
                },
                guest: null
            };

            await set(roomRef, roomData);

            console.log('[LiveSession] Room created:', code);

            // Configurar onDisconnect para borrar la sala
            await onDisconnect(roomRef).remove();

            roomRefPath.current = `rooms/${code}`;

            // Configurar listener
            setupRoomListener(code, true);

            setRoomCode(code);
            setIsHost(true);
            setSessionState(SESSION_STATE.WAITING);

        } catch (err) {
            console.error('[LiveSession] Create room error:', err);
            setError(err.message || 'Error al crear la sala');
            setSessionState(SESSION_STATE.ERROR);
        }
    }, [userId, setupRoomListener]);

    // =========================================================================
    // UNIRSE A SALA
    // =========================================================================

    const joinRoom = useCallback(async (code) => {
        const normalizedCode = (code || '').toUpperCase().trim();

        if (!ROOM_CODE_REGEX.test(normalizedCode)) {
            setError('Código inválido. Usa 4-6 caracteres.');
            return;
        }

        try {
            setError(null);
            setSessionState(SESSION_STATE.JOINING);

            const normalizedCode = code.toUpperCase().trim();
            const roomRef = ref(database, `rooms/${normalizedCode}`);

            const snapshot = await get(roomRef);

            if (!snapshot.exists()) {
                throw new Error('Sala no encontrada. Verifica el código.');
            }

            const roomData = snapshot.val();

            if (roomData.createdAt && Date.now() - roomData.createdAt > ROOM_EXPIRY_MS) {
                await remove(roomRef);
                throw new Error('La sala ha expirado. Pide un nuevo código.');
            }

            if (roomData.guest && roomData.guest.odxid !== userId && roomData.guest.connected) {
                throw new Error('La sala ya está llena.');
            }

            if (!roomData.host?.connected) {
                throw new Error('El host se desconectó. Pide un nuevo código.');
            }

            const myInventory = storage.getInventory();
            const myInventoryPayload = Protocol.generateV4(myInventory);

            // Escribir datos del guest
            const guestRef = ref(database, `rooms/${normalizedCode}/guest`);
            const guestData = {
                odxid: userId,
                inventory: myInventoryPayload,
                give: [],  // Mirror logic: only store what guest gives
                confirmed: false,
                connected: true
            };

            await set(guestRef, guestData);

            // Actualizar status de la sala
            const statusRef = ref(database, `rooms/${normalizedCode}/status`);
            await set(statusRef, 'connected');

            console.log('[LiveSession] Joined room:', normalizedCode);

            // Configurar onDisconnect para marcar como desconectado
            const guestConnectedRef = ref(database, `rooms/${normalizedCode}/guest/connected`);
            await onDisconnect(guestConnectedRef).set(false);

            roomRefPath.current = `rooms/${normalizedCode}`;

            // Configurar listener PASANDO el inventario del host
            setupRoomListener(normalizedCode, false, roomData.host.inventory);

            setRoomCode(normalizedCode);
            setIsHost(false);
            setSessionState(SESSION_STATE.CONNECTED);

        } catch (err) {
            console.error('[LiveSession] Join room error:', err);
            setError(err.message || 'Error al unirse a la sala');
            setSessionState(SESSION_STATE.ERROR);
        }
    }, [userId, setupRoomListener]);

    // =========================================================================
    // ACTUALIZAR SELECCIÓN
    // =========================================================================

    const toggleItem = useCallback((id) => {
        setMySelection(prev => {
            const list = prev.give || [];
            const newList = list.includes(id)
                ? list.filter(i => i !== id)
                : [...list, id];

            const newSelection = { give: newList };

            // Actualizar en Firebase (solo el array 'give')
            if (roomRefPath.current) {
                const role = isHostRef.current ? 'host' : 'guest';
                const giveRef = ref(database, `${roomRefPath.current}/${role}/give`);
                set(giveRef, newList).catch(console.error);

                // Resetear confirmación
                const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);
                set(confirmedRef, false).catch(console.error);
            }

            setMyConfirmed(false);
            return newSelection;
        });
    }, []);

    const selectAll = useCallback(() => {
        if (!matchData) return;

        const items = matchData.canGive;

        setMySelection({ give: [...items] });

        if (roomRefPath.current) {
            const role = isHostRef.current ? 'host' : 'guest';
            const giveRef = ref(database, `${roomRefPath.current}/${role}/give`);
            set(giveRef, items).catch(console.error);

            const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);
            set(confirmedRef, false).catch(console.error);
        }

        setMyConfirmed(false);
    }, [matchData]);

    const selectNone = useCallback(() => {
        setMySelection({ give: [] });

        if (roomRefPath.current) {
            const role = isHostRef.current ? 'host' : 'guest';
            const giveRef = ref(database, `${roomRefPath.current}/${role}/give`);
            set(giveRef, []).catch(console.error);

            const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);
            set(confirmedRef, false).catch(console.error);
        }

        setMyConfirmed(false);
    }, []);

    // =========================================================================
    // CONFIRMAR INTERCAMBIO
    // =========================================================================

    const confirmTrade = useCallback(async () => {
        if (!roomRefPath.current) return;

        // Guardar snapshot de lo que el peer está ofreciendo AHORA
        const currentPeerGive = peerSelection.give || [];
        confirmedWithPeerGiveRef.current = [...currentPeerGive];

        const role = isHostRef.current ? 'host' : 'guest';
        const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);

        // También guardar en Firebase el snapshot para validación cruzada
        const snapshotRef = ref(database, `${roomRefPath.current}/${role}/confirmedWithPeerGive`);

        try {
            await set(snapshotRef, currentPeerGive);
            await set(confirmedRef, true);
            setMyConfirmed(true);
            setSessionState(SESSION_STATE.CONFIRMING);
            console.log('[LiveSession] Trade confirmed by', role, 'expecting to receive:', currentPeerGive.length, 'items');
        } catch (err) {
            console.error('[LiveSession] Confirm error:', err);
            setError('Error al confirmar');
            confirmedWithPeerGiveRef.current = null;
        }
    }, [peerSelection.give]);

    const cancelConfirm = useCallback(async () => {
        if (!roomRefPath.current) return;

        const role = isHostRef.current ? 'host' : 'guest';
        const confirmedRef = ref(database, `${roomRefPath.current}/${role}/confirmed`);
        const snapshotRef = ref(database, `${roomRefPath.current}/${role}/confirmedWithPeerGive`);

        try {
            await set(confirmedRef, false);
            await set(snapshotRef, null);  // Limpiar snapshot
            confirmedWithPeerGiveRef.current = null;
            setMyConfirmed(false);
            setSessionState(SESSION_STATE.CONNECTED);
        } catch (err) {
            console.error('[LiveSession] Cancel confirm error:', err);
        }
    }, []);

    // =========================================================================
    // ABANDONAR SESIÓN
    // =========================================================================

    const leaveSession = useCallback(async () => {
        console.log('[LiveSession] Leaving session...');

        // Solo borrar la sala si NO se completó el intercambio exitosamente
        if (isHostRef.current && roomRefPath.current && sessionStateRef.current !== SESSION_STATE.COMPLETED) {
            try {
                const roomRef = ref(database, roomRefPath.current);
                await remove(roomRef);
            } catch (err) {
                console.error('[LiveSession] Error removing room:', err);
            }
        }

        if (!isHostRef.current && roomRefPath.current) {
            try {
                const guestConnectedRef = ref(database, `${roomRefPath.current}/guest/connected`);
                await set(guestConnectedRef, false);
            } catch (err) {
                console.error('[LiveSession] Error updating disconnect:', err);
            }
        }

        cleanup();

        setSessionState(SESSION_STATE.IDLE);
        setRoomCode(null);
        setIsHost(false);
        setError(null);
        setMatchData(null);
        setMySelection({ give: [] });
        setPeerSelection({ give: [] });
        setMyConfirmed(false);
        setPeerConfirmed(false);
        confirmedWithPeerGiveRef.current = null;
        isTradingRef.current = false;
        previousPeerGive.current = [];
    }, [cleanup]);

    // =========================================================================
    // RETURN
    // =========================================================================

    // Calculate what I will receive (mirror of peer's give)
    const myReceive = matchData
        ? (peerSelection.give || []).filter(id => matchData.canReceive.includes(id))
        : [];

    return {
        sessionState,
        roomCode,
        isHost,
        error,
        matchData,
        mySelection,
        peerSelection,
        myReceive,  // Calculated from peer's give
        myConfirmed,
        peerConfirmed,
        createRoom,
        joinRoom,
        leaveSession,
        toggleItem,
        selectAll,
        selectNone,
        confirmTrade,
        cancelConfirm
    };
};
