import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical UI Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Vaya, algo salió mal</h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Ha ocurrido un error inesperado en la interfaz. No te preocupes, tus datos están seguros en tu dispositivo.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            RECARGAR APLICACIÓN
                        </button>
                        <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Error: {this.state.error?.message || 'Unknown Error'}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
