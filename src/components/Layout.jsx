import { Outlet, Link, useLocation } from 'react-router-dom';
import { Icons } from './Icons';

export const Layout = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Album', Icon: Icons.Album },
        { path: '/swap', label: 'Swap', Icon: Icons.Exchange },
        { path: '/profile', label: 'My ID', Icon: Icons.User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">

            {/* Global Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(#64748b 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}>
            </div>

            {/* Main Content Area */}
            <main className="w-full max-w-lg mx-auto min-h-screen relative z-0">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="max-w-lg mx-auto pb-[env(safe-area-inset-bottom,12px)]">
                    <div className="flex justify-around items-center py-3 px-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const IconComponent = item.Icon;

                            return (
                                <Link
                                    to={item.path}
                                    key={item.path}
                                    className={`relative flex flex-col items-center justify-center w-full py-1 transition-all duration-300 group
                                        ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-indigo-50/50 rounded-xl scale-90 -z-10"></div>
                                    )}

                                    <div className={`mb-0.5 transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : 'group-hover:-translate-y-0.5'}`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>

                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                        {item.label}
                                    </span>

                                    {isActive && (
                                        <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/50"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
};
