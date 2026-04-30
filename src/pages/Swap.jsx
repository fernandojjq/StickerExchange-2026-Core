// ============================================================================
// ARCHIVO: src/pages/Swap.jsx
// VERSIÓN: 11.0 - Sistema Bimodal (Offline + Live con Firebase)
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { createPortal } from 'react-dom';
import { storage } from '../utils/storage';
import { Protocol } from '../utils/protocol';
import { Flag } from '../components/Flag';
import { Icons } from '../components/Icons';
import { HistoryPanel } from '../components/HistoryPanel';
import { useLiveSession, SESSION_STATE } from '../hooks/useLiveSession';
import { useLanguage } from '../hooks/useLanguage';
import { WelcomeGuide } from '../components/WelcomeGuide';

// ============================================================================
// CONSTANTES
// ============================================================================
const SWAP_TAB = {
    OFFLINE: 'offline',
    LIVE: 'live'
};

// ============================================================================
// HOOK: useCameraScanner
// ============================================================================
const useCameraScanner = (onScanSuccess) => {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shouldStart, setShouldStart] = useState(false);

    const scannerRef = useRef(null);
    const isMountedRef = useRef(true);
    const isStoppingRef = useRef(false);
    const onScanSuccessRef = useRef(onScanSuccess);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const cleanupScanner = useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;

        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }
            scanner.clear();
        } catch (err) {
            console.warn("Scanner cleanup:", err.message);
        } finally {
            scannerRef.current = null;
        }
    }, []);

    const stopScanner = useCallback(async () => {
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;
        setShouldStart(false);
        try {
            await cleanupScanner();
        } finally {
            if (isMountedRef.current) {
                setIsScanning(false);
                setIsLoading(false);
                setError(null);
            }
            isStoppingRef.current = false;
        }
    }, [cleanupScanner]);

    const initializeCamera = useCallback(async () => {
        if (!isMountedRef.current) return;

        const readerElement = document.getElementById("qr-reader");
        if (!readerElement) {
            setError("Error interno: Elemento de cámara no encontrado");
            setIsLoading(false);
            setIsScanning(false);
            return;
        }

        try {
            await cleanupScanner();

            const html5QrCode = new Html5Qrcode("qr-reader", { verbose: false });
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: "environment",
                        width: { ideal: 1920 },
                        height: { ideal: 1920 }
                    }
                },
                (decodedText) => {
                    if (isMountedRef.current && onScanSuccessRef.current) {
                        onScanSuccessRef.current(decodedText);
                    }
                },
                () => { }
            );

            if (isMountedRef.current) {
                setIsLoading(false);
                setError(null);
            }
        } catch (err) {
            console.error("Camera error:", err);
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsScanning(false);
                if (err.name === 'NotAllowedError') {
                    setError('Permiso de cámara denegado.');
                } else if (err.name === 'NotFoundError') {
                    setError('No se encontró cámara.');
                } else if (err.name === 'NotReadableError') {
                    setError('Cámara en uso por otra app.');
                } else {
                    setError('Error al iniciar la cámara.');
                }
            }
            await cleanupScanner();
        }
    }, [cleanupScanner]); // Removed onScanSuccess dependency to prevent re-renders

    useEffect(() => {
        if (!shouldStart) return;
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && shouldStart) initializeCamera();
        }, 150);
        return () => clearTimeout(timeoutId);
    }, [shouldStart, initializeCamera]);

    const startScanner = useCallback(() => {
        if (isScanning || isStoppingRef.current) return;
        setError(null);
        setIsLoading(true);
        setIsScanning(true);
        setShouldStart(true);
    }, [isScanning]);

    useEffect(() => {
        return () => { cleanupScanner(); };
    }, [cleanupScanner]);

    return {
        isScanning, isLoading, error, startScanner, stopScanner,
        retryScanner: useCallback(() => {
            setError(null);
            setShouldStart(false);
            setTimeout(() => {
                setIsLoading(true);
                setIsScanning(true);
                setShouldStart(true);
            }, 300);
        }, [])
    };
};

// ============================================================================
// COMPONENTE: QRCodeDisplay (Con fix para Samsung)
// ============================================================================
const QRCodeDisplay = ({ value, size = 280 }) => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const actualSize = Math.floor(size * Math.min(dpr, 2));

    return (
        <div className="qr-container bg-white p-4 rounded-2xl inline-block">
            <QRCodeCanvas
                value={value}
                size={actualSize}
                level="L"
                includeMargin={true}
                style={{ width: size, height: size, imageRendering: 'pixelated' }}
                bgColor="#FFFFFF"
                fgColor="#000000"
            />
        </div>
    );
};

// ============================================================================
// COMPONENTE: SelectableItemGrid
// ============================================================================
const SelectableItemGrid = ({ items, selectedItems, onToggleItem, type, urgentItems = [], readOnly = false }) => {
    const isReceive = type === 'receive';

    if (items.length === 0) {
        return (
            <p className={`text-center ${isReceive ? 'text-emerald-500' : 'text-indigo-500'} opacity-50 text-xs font-bold py-4`}>
                {isReceive ? 'Nada nuevo para ti' : 'Nada que entregar'}
            </p>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-2">
            {items.map(id => {
                const [iso, num] = id.split('-');
                const isSelected = selectedItems.includes(id);
                const isUrgent = urgentItems.includes(id);

                return (
                    <button
                        key={id}
                        onClick={() => onToggleItem(id)}
                        className={`relative p-2 rounded-xl text-center border-2 transition-all active:scale-95
                            ${isSelected
                                ? isReceive
                                    ? 'bg-emerald-50 border-emerald-200 shadow-md'
                                    : 'bg-indigo-50 border-indigo-200 shadow-md'
                                : 'bg-white border-slate-100 opacity-50'
                            }
                            ${isUrgent && isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                            ${readOnly ? 'cursor-default opacity-90' : ''}
                        `}
                        disabled={readOnly}
                    >
                        <div className={`absolute top-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold
                            ${isSelected
                                ? isReceive
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-indigo-500 border-indigo-500 text-white'
                                : 'bg-white border-slate-200'
                            }`}
                        >
                            {isSelected && '✓'}
                        </div>
                        <Flag iso={iso} size="sm" className="mx-auto" />
                        <div className="font-black text-slate-800 text-xs mt-1">{num}</div>
                        {isUrgent && <div className="text-[7px] font-bold text-amber-600 uppercase">Último</div>}
                    </button>
                );
            })}
        </div>
    );
};

// ============================================================================
// COMPONENTE: OfflineMatchModal
// ============================================================================
const OfflineMatchModal = ({
    scanResult,
    selectedReceive,
    selectedGive,
    onToggleReceive,
    onToggleGive,
    onSelectAllReceive,
    onSelectNoneReceive,
    onSelectAllGive,
    onSelectNoneGive,
    onConfirm,
    onClose,
    tradeProcessed
}) => {
    if (!scanResult) return null;

    return createPortal(
        <div className="fullscreen-overlay bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md max-h-[95vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl modal-animate">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black flex items-center gap-2 italic">
                            <Icons.Check className="w-5 h-5 text-emerald-400" />
                            COINCIDENCIA
                        </h2>
                        <p className="text-xs text-slate-400">Selecciona qué intercambiar</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Receive */}
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-black text-emerald-800 text-sm uppercase flex items-center gap-2">
                                <Icons.ArrowDown className="w-4 h-4" />
                                {t.swap.receiving_title}
                                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs">
                                    {selectedReceive.length}/{scanResult.get.length}
                                </span>
                            </h3>
                            <div className="flex gap-2 text-[10px]">
                                <button onClick={onSelectAllReceive} className="font-bold text-emerald-600 hover:underline">{t.swap.mark_all}</button>
                                <span className="text-emerald-300">|</span>
                                <button onClick={onSelectNoneReceive} className="font-bold text-emerald-600 hover:underline">{t.swap.clear}</button>
                            </div>
                        </div>
                        <SelectableItemGrid
                            items={scanResult.get}
                            selectedItems={selectedReceive}
                            onToggleItem={onToggleReceive}
                            type="receive"
                            urgentItems={scanResult.urgent || []}
                        />
                    </div>

                    {/* Give */}
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-black text-indigo-800 text-sm uppercase flex items-center gap-2">
                                <Icons.ArrowUp className="w-4 h-4" />
                                {t.swap.giving_title}
                                <span className="bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded text-xs">
                                    {selectedGive.length}/{scanResult.give.length}
                                </span>
                            </h3>
                            <div className="flex gap-2 text-[10px]">
                                <button onClick={onSelectAllGive} className="font-bold text-indigo-600 hover:underline">{t.swap.mark_all}</button>
                                <span className="text-indigo-300">|</span>
                                <button onClick={onSelectNoneGive} className="font-bold text-indigo-600 hover:underline">{t.swap.clear}</button>
                            </div>
                        </div>
                        <SelectableItemGrid
                            items={scanResult.give}
                            selectedItems={selectedGive}
                            onToggleItem={onToggleGive}
                            type="give"
                        />
                    </div>

                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <p className="text-amber-700 text-xs font-medium text-center">
                            {t.swap.reminder_tip}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white p-4 border-t border-slate-100 shrink-0">
                    {tradeProcessed ? (
                        <div className="w-full py-4 bg-emerald-500 text-white rounded-2xl flex flex-col items-center">
                            <Icons.Check className="w-8 h-8 mb-1" />
                            <span className="font-black uppercase tracking-widest text-sm">{t.swap.saved_status}</span>
                        </div>
                    ) : (
                        <button
                            onClick={onConfirm}
                            disabled={selectedReceive.length === 0 && selectedGive.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl 
                                       shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]
                                       active:scale-95 transition-all text-sm uppercase tracking-widest 
                                       flex items-center justify-center gap-2
                                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                        >
                            <Icons.Check className="w-5 h-5" />
                            {t.swap.confirm_btn}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ============================================================================
// COMPONENTE: CameraScannerModal
// ============================================================================
const CameraScannerModal = React.memo(({ isOpen, onClose, isLoading, error, onRetry }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fullscreen-overlay bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={onClose}
                    className="text-white px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.swap.close_btn}
                </button>
                <span className="text-white font-black tracking-widest text-xs uppercase">{t.swap.scanner_label}</span>
            </div>

            {/* Camera viewport */}
            <div className="flex-1 relative">
                {(isLoading || error) && (
                    <div className="absolute z-30 inset-0 flex flex-col items-center justify-center text-white bg-black">
                        {isLoading ? (
                            <>
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold tracking-widest animate-pulse">{t.swap.starting_camera}</p>
                            </>
                        ) : (
                            <div className="text-center px-6">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icons.Warning className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="font-bold mb-4 text-sm">{error}</p>
                                <button onClick={onRetry} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-sm">
                                    {t.swap.retry_btn}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div id="qr-reader" className="absolute inset-0 w-full h-full" />

                {!isLoading && !error && (
                    <>
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                            <div className="w-72 h-72 border-2 border-white/30 rounded-3xl relative">
                                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                            </div>
                        </div>
                        <div className="absolute bottom-8 inset-x-0 flex justify-center z-10">
                            <p className="text-white/80 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                                {t.swap.aim_hint}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
});

// ============================================================================
// COMPONENTE: LiveSessionView
// ============================================================================
const LiveSessionView = ({ session, onLeave }) => {
    const { t } = useLanguage();
    const {
        sessionState, roomCode, isHost, error,
        matchData, mySelection, myReceive,
        myConfirmed, peerConfirmed,
        toggleItem, selectAll, selectNone,
        confirmTrade, cancelConfirm
    } = session;

    // Estado: Creando sala
    if (sessionState === SESSION_STATE.CREATING) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-bold">{t.swap.live.creating}</p>
            </div>
        );
    }

    // Estado: Esperando invitado
    if (sessionState === SESSION_STATE.WAITING) {
        return (
            <div className="text-center">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-6 rounded-3xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-20" />

                    <p className="text-sm text-slate-400 mb-3">{t.swap.live.room_code}</p>
                    <div className="text-5xl font-black tracking-[0.3em] mb-6 font-mono">{roomCode}</div>

                    <div className="flex justify-center mb-4">
                        <div className="border-4 border-white rounded-2xl overflow-hidden shadow-2xl">
                            <QRCodeDisplay value={`swap26:live:${roomCode}`} size={200} />
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">
                        {t.swap.live.qr_hint}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
                    <div className="w-2 h-2 bg-amber-500 rounded-full pulse-soft" />
                    <p className="text-sm font-medium">{t.swap.live.waiting_peer}</p>
                </div>

                <button
                    onClick={onLeave}
                    className="w-full max-w-xs py-4 text-rose-500 font-black text-sm border-2 border-rose-100 hover:bg-rose-50 rounded-2xl transition active:scale-95 mx-auto"
                >
                    {t.swap.live.cancel_room}
                </button>
            </div>
        );
    }

    // Estado: Uniéndose
    if (sessionState === SESSION_STATE.JOINING) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-bold">{t.swap.live.joining}</p>
            </div>
        );
    }

    // Estado: Error
    if (sessionState === SESSION_STATE.ERROR) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Warning className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-slate-800 font-bold mb-2">{t.swap.live.conn_error}</p>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button
                    onClick={onLeave}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl"
                >
                    {t.swap.live.back}
                </button>
            </div>
        );
    }

    // Estado: Completado
    if (sessionState === SESSION_STATE.COMPLETED) {
        return (
            <div className="text-center py-8 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icons.Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t.swap.live.success_title}</h2>
                <p className="text-slate-500 mb-6 px-6">
                    {t.swap.live.success_desc}
                </p>
                <button
                    onClick={onLeave}
                    className="w-full max-w-xs px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition"
                >
                    {t.swap.live.understood}
                </button>
            </div>
        );
    }

    // Estado: Conectado / Confirmando
    if (sessionState === SESSION_STATE.CONNECTED || sessionState === SESSION_STATE.CONFIRMING) {
        return (
            <div className="space-y-4">
                {/* Estado de conexión */}
                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-soft" />
                        <span className="text-sm font-bold text-emerald-700">
                            {isHost ? t.swap.live.peer_joined : t.swap.live.connected}
                        </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                        {t.swap.live.room}: {roomCode}
                    </span>
                </div>

                {matchData && (
                    <>
                        {/* Receive - Read Only */}
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h3 className="font-black text-emerald-800 text-sm uppercase flex items-center gap-2">
                                        <Icons.ArrowDown className="w-4 h-4" />
                                        {t.swap.live.receiving} ({myReceive.length})
                                    </h3>
                                    <p className="text-[10px] text-emerald-600 mt-0.5">
                                        {t.swap.live.receive_desc}
                                    </p>
                                </div>
                            </div>
                            <SelectableItemGrid
                                items={matchData.canReceive}
                                selectedItems={myReceive}
                                onToggleItem={() => { }} // Read only
                                type="receive"
                                urgentItems={matchData.urgentItems || []}
                                readOnly={true}
                            />
                        </div>

                        {/* Give - Interactive */}
                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-black text-indigo-800 text-sm uppercase flex items-center gap-2">
                                    <Icons.ArrowUp className="w-4 h-4" />
                                    {t.swap.live.giving} ({mySelection.give.length}/{matchData.canGive.length})
                                </h3>
                                <div className="flex gap-2 text-[10px]">
                                    <button onClick={() => selectAll()} className="font-bold text-indigo-600">{t.swap.live.all}</button>
                                    <span className="text-indigo-300">|</span>
                                    <button onClick={() => selectNone()} className="font-bold text-indigo-600">{t.swap.live.none}</button>
                                </div>
                            </div>
                            <SelectableItemGrid
                                items={matchData.canGive}
                                selectedItems={mySelection.give}
                                onToggleItem={(id) => toggleItem(id)}
                                type="give"
                            />
                        </div>

                        {/* Estado de confirmación */}
                        <div className="bg-slate-100 rounded-xl p-4">
                            <p className="text-xs text-slate-500 text-center mb-3 font-bold uppercase">{t.swap.live.conf_status}</p>
                            <div className="flex justify-around items-center">
                                <div className="text-center">
                                    <div className={`w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center ${myConfirmed ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        {myConfirmed && <Icons.Check className="w-5 h-5 text-white" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{t.swap.live.you}</span>
                                </div>
                                <div className="text-2xl text-slate-300">⟷</div>
                                <div className="text-center">
                                    <div className={`w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center ${peerConfirmed ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        {peerConfirmed && <Icons.Check className="w-5 h-5 text-white" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{t.swap.live.friend}</span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-2">
                            {myConfirmed ? (
                                <button
                                    onClick={cancelConfirm}
                                    className="w-full py-4 bg-amber-100 text-amber-700 font-bold rounded-2xl flex items-center justify-center gap-2"
                                >
                                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    {t.swap.live.waiting_friend} ({t.swap.live.cancel})
                                </button>
                            ) : (
                                <button
                                    onClick={confirmTrade}
                                    disabled={myReceive.length === 0 && mySelection.give.length === 0}
                                    className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl 
                                               active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed
                                               flex items-center justify-center gap-2"
                                >
                                    <Icons.Check className="w-5 h-5" />
                                    {t.swap.live.confirm_part}
                                </button>
                            )}
                            <button
                                onClick={onLeave}
                                className="w-full py-4 text-rose-500 font-black text-sm border-2 border-rose-100 hover:bg-rose-50 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Icons.Warning className="w-4 h-4" />
                                {t.swap.live.leave_room}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Loading genérico
    return (
        <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">{t.swap.connecting}</p>
        </div>
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL: Swap
// ============================================================================
export const Swap = () => {
    const { t, language } = useLanguage();
    // Tab activo
    const [activeTab, setActiveTab] = useState(SWAP_TAB.OFFLINE);
    const [showGuide, setShowGuide] = useState(false);

    // SEO: Update page title
    useEffect(() => {
        document.title = `${t.swap.title} | Swap-26`;
    }, [t.swap.title]);

    // Estado general
    const [inventory, setInventory] = useState(() => storage.getInventory());
    const [qrData, setQrData] = useState('');
    const [historyRefresh, setHistoryRefresh] = useState(0);

    // Offline states
    const [showScanner, setShowScanner] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [selectedReceive, setSelectedReceive] = useState([]);
    const [selectedGive, setSelectedGive] = useState([]);
    const [tradeProcessed, setTradeProcessed] = useState(false);

    // Live session
    const [joinCode, setJoinCode] = useState('');
    const [pendingJoinCode, setPendingJoinCode] = useState(null);
    const liveSession = useLiveSession();

    // Refs
    const imageInputRef = useRef(null);
    const stopScannerRef = useRef(null);

    // Generar QR cuando cambie inventario
    useEffect(() => {
        setQrData(Protocol.generateV4(inventory));
    }, [inventory]);

    // Helper: Verificar urgencia
    const checkUrgentStatus = useCallback((id, inv) => {
        const parts = id.split('-');
        if (parts.length < 2) return false;
        const country = parts[0];
        const countryStickers = Protocol.getAllIds().filter(sid => sid.startsWith(country + '-'));
        const missingCount = countryStickers.filter(sid => (inv[sid] || 0) === 0).length;
        return missingCount === 1 && (inv[id] || 0) === 0;
    }, []);

    // Handler: Escaneo exitoso
    const handleScanSuccess = useCallback((decodedText) => {
        if (navigator.vibrate) navigator.vibrate(50);

        // Verificar si es un QR de sesión live
        if (decodedText.startsWith('swap26:live:')) {
            const code = decodedText.replace('swap26:live:', '');
            if (stopScannerRef.current) stopScannerRef.current();
            setShowScanner(false);
            setActiveTab(SWAP_TAB.LIVE);
            setJoinCode(code);
            setPendingJoinCode(code);
            return;
        }

        // Parsear QR de inventario normal
        const parsed = Protocol.parse(decodedText);
        if (!parsed) return;

        if (parsed.error === 'INCOMPATIBLE_STRUCTURE') {
            setScanError(parsed.message);
            if (stopScannerRef.current) stopScannerRef.current();
            setShowScanner(false);
            return;
        }

        if (stopScannerRef.current) stopScannerRef.current();
        setShowScanner(false);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        const currentInv = storage.getInventory();
        const youReceive = parsed.repeated.filter(id => (currentInv[id] || 0) === 0);
        const youGive = parsed.missing.filter(id => (currentInv[id] || 0) > 1);
        const urgentItems = youReceive.filter(id => checkUrgentStatus(id, currentInv));

        setSelectedReceive([...youReceive]);
        setSelectedGive([...youGive]);

        setScanResult({
            get: youReceive,
            give: youGive,
            urgent: urgentItems,
            currentInventory: { ...currentInv }
        });
    }, [checkUrgentStatus, liveSession]);

    // Effect: Handle Auto-Join
    useEffect(() => {
        if (pendingJoinCode && activeTab === SWAP_TAB.LIVE && !liveSession.roomCode && !liveSession.error) {
            // Solo unirse si no estamos ya en una sala o con error
            liveSession.joinRoom(pendingJoinCode);
            setPendingJoinCode(null);
        }
    }, [pendingJoinCode, activeTab, liveSession]);

    // Camera scanner
    const { isLoading, error: cameraError, startScanner, stopScanner, retryScanner } = useCameraScanner(handleScanSuccess);

    useEffect(() => {
        stopScannerRef.current = stopScanner;
    }, [stopScanner]);

    useEffect(() => {
        if (showScanner) {
            startScanner();
        } else {
            stopScanner();
        }
    }, [showScanner, startScanner, stopScanner]);

    // Handle Camera Permissions/Errors Automatically
    useEffect(() => {
        if (cameraError) {
            setShowScanner(false);
            setScanError(cameraError);
        }
    }, [cameraError]);

    // Handler: Escanear desde imagen
    const handleImageSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Crear elemento temporal para el scanner
            const tempDiv = document.createElement('div');
            tempDiv.id = 'temp-qr-reader';
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            const html5QrCode = new Html5Qrcode('temp-qr-reader');
            const result = await html5QrCode.scanFile(file, true);

            html5QrCode.clear();
            document.body.removeChild(tempDiv);

            handleScanSuccess(result);
        } catch (err) {
            console.error('Image scan failed:', err);
            setScanError(t.swap.qr_error);
        }

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    }, [handleScanSuccess]);

    // Confirmar intercambio offline
    const confirmOfflineTrade = useCallback(() => {
        // Guard contra doble ejecución
        if (!scanResult || tradeProcessed) return;
        if (selectedReceive.length === 0 && selectedGive.length === 0) return;

        // Marcar como procesado PRIMERO
        setTradeProcessed(true);

        // Capturar valores actuales para evitar closures problemáticos
        const itemsToReceive = [...selectedReceive];
        const itemsToGive = [...selectedGive];

        // Actualizar inventario
        const currentInventory = storage.getInventory();
        const nextInv = { ...currentInventory };

        itemsToReceive.forEach(id => {
            nextInv[id] = (nextInv[id] || 0) + 1;
        });

        itemsToGive.forEach(id => {
            const current = nextInv[id] || 0;
            if (current > 1) nextInv[id] = current - 1;
        });

        // Guardar todo de una vez
        storage.saveInventory(nextInv);
        storage.addToHistory({
            received: itemsToReceive,
            given: itemsToGive,
            type: 'offline'
            // Sin roomCode para offline
        });

        // Actualizar estado local
        setInventory(nextInv);

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setHistoryRefresh(h => h + 1);

        setTimeout(() => {
            setScanResult(null);
            setSelectedReceive([]);
            setSelectedGive([]);
            setTradeProcessed(false);
        }, 1500);
    }, [scanResult, tradeProcessed, selectedReceive, selectedGive]);

    // Toggle handlers
    const toggleReceiveItem = useCallback((id) => {
        setSelectedReceive(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const toggleGiveItem = useCallback((id) => {
        setSelectedGive(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    // Verificar si hay sesión live activa
    const isLiveSessionActive = liveSession.sessionState !== SESSION_STATE.IDLE;

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto min-h-screen">
            {/* Hidden input para escaneo de imagen */}
            <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Icons.Logo className="w-6 h-6" />
                    </div>
                    <div className="leading-tight">
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-900 leading-none uppercase">SWAP-26</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.swap.subtitle}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowGuide(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <Icons.Info className="w-5 h-5" />
                </button>
            </div>

            <WelcomeGuide isOpen={showGuide} onClose={() => setShowGuide(false)} type="swap" />

            {/* Error Modal */}
            {scanError && (
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full shadow-2xl modal-animate">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Warning className="w-8 h-8 text-amber-600" />
                        </div>
                        <p className="text-slate-800 font-bold mb-4">{scanError}</p>
                        <button
                            onClick={() => setScanError(null)}
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl"
                        >
                            {t.common.understand}
                        </button>
                    </div>
                </div>
            )}

            {/* Contenido principal */}
            {!isLiveSessionActive ? (
                <>
                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                        <button
                            onClick={() => setActiveTab(SWAP_TAB.OFFLINE)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === SWAP_TAB.OFFLINE
                                ? 'bg-white text-slate-900 shadow-md'
                                : 'text-slate-500'
                                }`}
                        >
                            <span>📷</span> {t.swap.offline_btn}
                        </button>
                        <button
                            onClick={() => setActiveTab(SWAP_TAB.LIVE)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === SWAP_TAB.LIVE
                                ? 'bg-white text-slate-900 shadow-md'
                                : 'text-slate-500'
                                }`}
                        >
                            <span className="text-rose-500">●</span> {t.swap.live_btn}
                        </button>
                    </div>

                    {/* TAB: OFFLINE */}
                    {activeTab === SWAP_TAB.OFFLINE && (
                        <div className="space-y-3">
                            {/* Escanear con cámara */}
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-xl active:scale-[0.98] transition-all text-left flex items-center justify-between group"
                            >
                                <div>
                                    <h2 className="text-lg font-black italic tracking-tighter">{t.swap.scanner_title}</h2>
                                    <p className="text-indigo-200 text-xs font-bold uppercase">{t.swap.camera_subtitle}</p>
                                </div>
                                <div className={`w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition will-change-transform`}>
                                    <Icons.Camera className="w-6 h-6" />
                                </div>
                            </button>

                            {/* Escanear desde imagen */}
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full bg-white text-slate-800 border-2 border-slate-100 rounded-2xl p-5 shadow-lg active:scale-[0.98] transition-all text-left flex items-center justify-between"
                            >
                                <div>
                                    <h2 className="text-lg font-black italic tracking-tighter">{t.swap.image_title}</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase">{t.swap.image_subtitle}</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                    <Icons.Upload className="w-6 h-6 text-slate-600" />
                                </div>
                            </button>

                            {/* Mostrar mi QR */}
                            <button
                                onClick={() => setShowQR(true)}
                                className="w-full bg-white text-slate-800 border-2 border-slate-100 rounded-2xl p-5 shadow-lg active:scale-[0.98] transition-all text-left flex items-center justify-between"
                            >
                                <div>
                                    <h2 className="text-lg font-black italic tracking-tighter">{t.swap.my_qr_title}</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase">{t.swap.my_qr_subtitle}</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                    <Icons.QRCode className="w-6 h-6 text-slate-600" />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* TAB: LIVE */}
                    {activeTab === SWAP_TAB.LIVE && (
                        <div className="space-y-4">
                            {/* Crear sala */}
                            <button
                                onClick={() => liveSession.createRoom()}
                                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-2xl p-5 shadow-xl active:scale-[0.98] transition-all text-left flex items-center justify-between group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10" />
                                <div className="relative z-10">
                                    <h2 className="text-lg font-black italic tracking-tighter">{t.swap.create_room_title}</h2>
                                    <p className="text-rose-100 text-xs font-bold uppercase">{t.swap.create_room_subtitle}</p>
                                </div>
                                <div className="relative z-10 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                                    <Icons.Plus className="w-6 h-6" />
                                </div>
                            </button>

                            {/* Unirse a sala */}
                            <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-lg">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Icons.User className="w-4 h-4 text-slate-400" />
                                    {t.swap.join_room_title}
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                        placeholder={t.swap.code_placeholder}
                                        maxLength={6}
                                        className="flex-1 min-w-0 px-3 py-3 bg-slate-100 rounded-xl font-mono text-lg uppercase tracking-widest text-center font-bold placeholder:text-slate-300"
                                    />
                                    <button
                                        onClick={() => liveSession.joinRoom(joinCode)}
                                        disabled={joinCode.length < 4}
                                        className="flex-shrink-0 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
                                    >
                                        {t.swap.join_btn}
                                    </button>
                                </div>
                                <div className="mt-3 text-center">
                                    <button
                                        onClick={() => setShowScanner(true)}
                                        className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition hover:bg-slate-50 hover:border-slate-300"
                                    >
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <Icons.QRCode className="w-5 h-5 text-slate-500" />
                                        </div>
                                        {t.swap.scan_room_btn}
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                                <p className="text-[10px] text-amber-700 leading-relaxed">
                                    <span className="text-base">⚡</span>
                                    {t.swap.live_mode_desc}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Historial */}
                    <HistoryPanel refreshTrigger={historyRefresh} />
                </>
            ) : (
                /* Sesión Live Activa (Modal Full Screen) */
                createPortal(
                    <div className="fixed inset-0 z-[999] bg-slate-50 overflow-y-auto overscroll-none">
                        <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col pb-40">
                            <LiveSessionView session={liveSession} onLeave={liveSession.leaveSession} />
                        </div>
                    </div>,
                    document.body
                )
            )}

            {/* Modal: Scanner de Cámara */}
            <CameraScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                isLoading={isLoading}
                error={cameraError}
                onRetry={retryScanner}
            />

            {/* Modal: Mostrar mi QR */}
            {showQR && createPortal(
                <div className="fullscreen-overlay bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 text-center shadow-2xl modal-animate relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-[32px]" />

                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition"
                        >
                            <Icons.Close className="w-4 h-4 text-slate-600" />
                        </button>

                        <div className="mt-4 mb-6">
                            <div className="border-4 border-slate-900 rounded-2xl overflow-hidden shadow-xl inline-block">
                                <QRCodeDisplay value={qrData} size={260} />
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter uppercase">{t.swap.qr_modal_title}</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            {t.swap.qr_modal_desc}
                        </p>

                        <div className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-100">
                            <p className="text-amber-700 text-xs font-medium">
                                {t.swap.qr_brightness_tip}
                            </p>
                        </div>

                        <div className="flex justify-center gap-2">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold">
                                V4
                            </span>
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold">
                                {Protocol.getStructureHash()}
                            </span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal: Match Result (Offline) */}
            <OfflineMatchModal
                scanResult={scanResult}
                selectedReceive={selectedReceive}
                selectedGive={selectedGive}
                onToggleReceive={toggleReceiveItem}
                onToggleGive={toggleGiveItem}
                onSelectAllReceive={() => scanResult && setSelectedReceive([...scanResult.get])}
                onSelectNoneReceive={() => setSelectedReceive([])}
                onSelectAllGive={() => scanResult && setSelectedGive([...scanResult.give])}
                onSelectNoneGive={() => setSelectedGive([])}
                onConfirm={confirmOfflineTrade}
                onClose={() => { setScanResult(null); setSelectedReceive([]); setSelectedGive([]); }}
                tradeProcessed={tradeProcessed}
            />
        </div>
    );
};
