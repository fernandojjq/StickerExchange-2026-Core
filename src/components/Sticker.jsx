import React, { useState, useEffect, useRef } from 'react';
import { Flag } from './Flag';

// Visual State Helper
const getVisualState = (qty) => {
    if (qty === 0) return 'missing';
    if (qty === 1) return 'collected';
    return 'repeated';
};

// Styles Configuration - STATIC to avoid recreation
const STICKER_STYLES = {
    missing: {
        container: "bg-slate-100 border-slate-200 opacity-60 hover:opacity-90",
        special: "bg-amber-50/50 border-amber-300/50 opacity-60 hover:opacity-90",
        text: "text-slate-400",
        border: "border-slate-200"
    },
    collected: {
        container: "bg-white border-indigo-500 shadow-md",
        text: "text-indigo-900",
        border: "border-indigo-500 ring-1 ring-indigo-500"
    },
    repeated: {
        container: "bg-indigo-50 border-indigo-600 shadow-lg",
        text: "text-indigo-900",
        border: "border-indigo-600 ring-2 ring-indigo-400"
    }
};

export const Sticker = React.memo(({
    id,
    country,
    number,
    quantity = 0,
    onIncrement,
    onDecrement,
    isSpecial = false,
    isUrgent = false
}) => {
    const currentState = getVisualState(quantity);
    const [shouldWobble, setShouldWobble] = useState(false);
    const prevQtyRef = useRef(quantity);

    // Wobble effect when going from 0 to 1
    useEffect(() => {
        if (prevQtyRef.current === 0 && quantity === 1) {
            const wobbleTimer = setTimeout(() => setShouldWobble(true), 0);
            const resetTimer = setTimeout(() => setShouldWobble(false), 700);
            return () => {
                clearTimeout(wobbleTimer);
                clearTimeout(resetTimer);
            };
        }
        prevQtyRef.current = quantity;
    }, [quantity]);

    // Explicit Handlers
    const handleMainClick = (e) => {
        e.stopPropagation();
        onIncrement && onIncrement(id);
    };

    const handleDecrementClick = (e) => {
        e.stopPropagation();
        onDecrement && onDecrement(id);
    };

    // Styles
    const activeStyle = STICKER_STYLES[currentState];
    const containerClasses = currentState === 'missing' && isSpecial ? STICKER_STYLES.missing.special : activeStyle.container;

    // Holographic effect ONLY when collected (quantity > 0) AND special
    const holoClass = (isSpecial && quantity > 0)
        ? (quantity > 1 ? 'holo-effect holo-rainbow' : 'holo-effect holo-gold')
        : '';

    // Urgent glow effect
    const urgentClass = isUrgent && quantity === 0 ? 'urgent-glow' : '';

    return (
        <div
            className={`
                relative aspect-[3/4] rounded-lg border-2 p-1 
                transition-all duration-200 ease-out select-none cursor-pointer group
                transform-gpu backface-hidden will-change-transform
                touch-manipulation
                ${containerClasses} ${activeStyle.border}
                ${holoClass}
                ${urgentClass}
                ${shouldWobble ? 'animate-wobble' : ''}
                active:scale-[0.97]
            `}
            onClick={handleMainClick}
            role="button"
            aria-label={`Sticker ${country} ${number}, Quantity ${quantity}`}
        >
            {/* Header: Flag + Number */}
            <div className="flex justify-between items-center mb-1">
                <Flag iso={country} size="sm" className="shadow-sm rounded-[2px]" />
                <span className={`text-[10px] font-black font-mono ${quantity > 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                    {number}
                </span>
            </div>

            {/* Center Content: Minimalist Number - IMPROVED OPACITY */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-4xl font-black tracking-tighter ${activeStyle.text} ${(isSpecial && quantity > 0) ? 'text-holo' : quantity === 0 ? 'opacity-50' : 'opacity-20'}`}>
                    {number}
                </span>
            </div>

            {/* Footer / Progress Indicator */}
            {quantity > 0 && (
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-full" />
                </div>
            )}

            {/* Special Indicator for MISSING special items */}
            {isSpecial && quantity === 0 && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                        ★
                    </span>
                </div>
            )}

            {/* Special Badge for Holographic Items (collected) */}
            {isSpecial && quantity > 0 && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[8px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                        ★
                    </span>
                </div>
            )}

            {/* Urgent Badge */}
            {isUrgent && quantity === 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                        !
                    </span>
                </div>
            )}

            {/* CONTROLS: Minus Button */}
            {quantity > 0 && (
                <button
                    onClick={handleDecrementClick}
                    className="absolute -top-2 -left-2 z-50 w-6 h-6 bg-rose-500 text-white rounded-full 
                               flex items-center justify-center shadow-md hover:bg-rose-600 active:bg-rose-700
                               transition-transform hover:scale-110 active:scale-90"
                    title="Remove duplicate"
                >
                    <span className="font-bold text-sm leading-none mb-[1px]">-</span>
                </button>
            )}

            {/* CONTROLS: Plus Button (for duplicates) */}
            {quantity > 0 && (
                <button
                    onClick={handleMainClick}
                    className="absolute -bottom-2 -right-2 z-50 w-6 h-6 bg-indigo-500 text-white rounded-full 
                               flex items-center justify-center shadow-md hover:bg-indigo-600 active:bg-indigo-700
                               transition-transform hover:scale-110 active:scale-90"
                    title="Add duplicate"
                >
                    <span className="font-bold text-sm leading-none mb-[1px]">+</span>
                </button>
            )}

            {/* BADGE: Repeated Count */}
            {quantity > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 z-50">
                    <div className="bg-white text-indigo-600 font-black text-[10px] 
                                    px-1.5 py-0.5 rounded-md border-2 border-indigo-600 shadow-sm">
                        x{quantity}
                    </div>
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    return (
        prev.id === next.id &&
        prev.quantity === next.quantity &&
        prev.country === next.country &&
        prev.isSpecial === next.isSpecial &&
        prev.isUrgent === next.isUrgent
    );
});
