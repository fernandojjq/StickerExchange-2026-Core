import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/Icons';

export const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <Icons.Album className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">404</h1>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-4">Cromo no encontrado</h2>
            <p className="text-slate-500 max-w-xs mb-10">
                Parece que esta página se ha perdido de tu colección. Volvamos al álbum principal.
            </p>
            <Link 
                to="/" 
                className="bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
            >
                Volver al Álbum
            </Link>
        </div>
    );
};
