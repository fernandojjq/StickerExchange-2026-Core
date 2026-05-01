import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Icons } from '../components/Icons';

export const Info = () => {
    const { t } = useLanguage();

    // FAQ Data (Hardcoded for now, can be moved to translations later if needed)
    const faqs = [
        {
            q: "¿Es esta una aplicación oficial?",
            a: "No. Swap-26 es una herramienta independiente creada por y para coleccionistas. No estamos afiliados a Panini ni a la FIFA."
        },
        {
            q: "¿Cómo funciona el Intercambio Live?",
            a: "El modo Live permite sincronizar tu inventario con el de un amigo en tiempo real. Uno crea una sala, el otro ingresa el código, y la app les muestra automáticamente qué cromos pueden intercambiar basándose en las repetidas de ambos."
        },
        {
            q: "¿Mis datos están seguros?",
            a: "Totalmente. Tu inventario se guarda localmente en tu navegador (LocalStorage). No requerimos registros, correos electrónicos ni contraseñas. Los datos de las salas Live son temporales y se borran al terminar la sesión."
        },
        {
            q: "¿Cómo funciona el Intercambio Offline (Cámara)?",
            a: "Abre tu 'Código QR' y pide a un amigo que lo escanee. La app cruzará ambas colecciones al instante. Importante: A diferencia del modo 'En Vivo', en el modo Offline los cambios solo se guardan automáticamente en el teléfono de quien escanea. El otro coleccionista deberá escanear de vuelta o marcar sus cambios manualmente."
        },
        {
            q: "¿Qué significan los colores en los cromos?",
            a: "Gris: Te falta. Azul: Lo tienes. Azul Intenso: Tienes repetidas (aparecerá un indicador x2, x3, etc.). Dorado/Efecto: Cromos especiales o brillantes."
        },
        {
            q: "¿Cómo puedo reportar un error o dar una sugerencia?",
            a: "¡Nos encanta recibir feedback! Puedes escribirnos directamente a swap26app@gmail.com."
        }
    ];

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Icons.Info className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none uppercase">Info & FAQ</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conoce más sobre Swap-26</p>
                </div>
            </div>

            {/* About Section */}
            <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <h2 className="text-xl font-black italic mb-4 uppercase tracking-tight">Sobre el Proyecto</h2>
                <div className="space-y-4 text-indigo-50 text-sm leading-relaxed font-medium">
                    <p>
                        Swap-26 nació con una misión simple: hacer que la experiencia de coleccionar cromos de la Copa del Mundo 2026 sea más rápida, social y digital.
                    </p>
                    <p>
                        Diseñada para funcionar sin fricciones, permite llevar tu inventario en el bolsillo y comparar repetidas con amigos en segundos, eliminando las listas en papel y los errores al intercambiar.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-6">
                <div className="px-2">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        Preguntas Frecuentes
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 mb-2">{faq.q}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Footer */}
            <footer className="mt-12 text-center bg-slate-50 rounded-3xl p-8 border border-dashed border-slate-200">
                <h3 className="text-sm font-black text-slate-900 uppercase mb-2">Comunidad y Soporte</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6">Síguenos para novedades y tips</p>
                
                <div className="flex flex-col gap-3 items-center">
                    <a 
                        href="mailto:swap26app@gmail.com" 
                        className="w-full flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-indigo-600 font-black text-sm hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Icons.Email className="w-5 h-5" />
                        swap26app@gmail.com
                    </a>
                    
                    <a 
                        href="https://x.com/Swap_26" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 px-6 py-3 rounded-2xl shadow-sm text-white font-black text-sm hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Icons.X className="w-4 h-4" />
                        @Swap_26
                    </a>
                </div>
            </footer>
        </div>
    );
};
