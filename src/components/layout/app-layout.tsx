'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Map,
    LogOut,
    Menu,
    Plus,
    Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout } from '@/lib/auth';
import { cn, formatUserName } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTripStore } from '@/lib/store';
import { ProfileSettingsDialog } from '@/components/profile/profile-settings-dialog';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_NAV_ITEMS = [
    { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['user', 'admin'] },
    { href: '/trips', label: 'Minhas Viagens', icon: Map, roles: ['user', 'admin'] },
    { href: '/manager/tracking', label: 'Acompanhar Viagens', icon: Users, roles: ['admin'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const { user, trips, isLoading } = useTripStore();

    useEffect(() => {
        if (!isLoading && !user && pathname !== '/login' && pathname !== '/forgot-password' && pathname !== '/reset-password') {
            router.push('/login');
        }
    }, [isLoading, user, pathname, router]);

    const handleLogout = async () => {
        await logout();
    };

    const userRole = user?.role || 'user';
    const filteredNavItems = BASE_NAV_ITEMS.filter(item => {
        if (!item.roles.includes(userRole)) return false;
        const userTrips = trips.filter(t => t.userId === user?.id);
        if (item.href === '/trips' && userTrips.length === 0) return false;
        return true;
    });

    const NavLink = ({ item, mobile = false }: { item: typeof BASE_NAV_ITEMS[0], mobile?: boolean }) => {
        const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/manager/tracking' && pathname.startsWith('/manager/trips'));
        return (
            <Link
                href={item.href}
                onClick={() => mobile && setIsOpen(false)}
            >
                <motion.div
                    whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold tracking-tight relative overflow-hidden group",
                        isActive
                            ? "text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                            : "text-muted-foreground/60 hover:text-white"
                    )}
                >
                    {isActive && (
                        <motion.div 
                            layoutId="activeNav"
                            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-l-4 border-primary z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                    <item.icon className={cn("w-5 h-5 relative z-10", isActive ? "text-primary" : "group-hover:text-white")} />
                    <span className="relative z-10">{item.label}</span>
                </motion.div>
            </Link>
        );
    };

    if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-premium-gradient flex flex-col md:flex-row antialiased">
            {/* Desktop Sidebar */}
            <motion.aside 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex w-[280px] flex-col glass-card fixed top-4 left-4 h-[calc(100vh-2rem)] z-30 rounded-3xl shadow-2xl overflow-hidden border border-primary/10 dark:border-white/5 shadow-primary/5 dark:shadow-black/50"
            >
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                            <Map className="w-5 h-5" />
                        </motion.div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl leading-none text-gradient">Viagens</span>
                        {userRole === 'admin' && <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-black mt-1">Gestor</span>}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {filteredNavItems.map((item, idx) => (
                        <motion.div
                            key={item.href}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                        >
                            <NavLink item={item} />
                        </motion.div>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-3xl">
                    <div className="p-4 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <ProfileSettingsDialog>
                                <div className="relative group/avatar">
                                    <Avatar className="w-12 h-12 cursor-pointer border-2 border-white/10 group-hover/avatar:border-primary transition-all shadow-2xl">
                                        <AvatarImage src={user?.avatar_url} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-black">
                                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0a0b] rounded-full" />
                                </div>
                            </ProfileSettingsDialog>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-white text-sm truncate leading-none mb-1">{formatUserName(user?.name)}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">{user?.role || 'Viajante'}</p>
                            </div>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all group/logout relative z-10 px-3" 
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3 group-hover/logout:scale-110 transition-transform" />
                            <span className="font-bold text-xs uppercase tracking-widest">Sair da Conta</span>
                        </Button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-[310px] flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="h-20 glass-card fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:hidden rounded-none border-x-0 border-t-0 border-b">
                    <div className="flex items-center gap-3">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85vw] max-w-xs p-0 glass-card border-0 rounded-r-3xl">
                                <div className="p-8 border-b border-white/10">
                                    <span className="font-bold text-2xl text-gradient">Menu</span>
                                    {userRole === 'admin' && <p className="text-[10px] uppercase text-muted-foreground tracking-widest font-black mt-1">Gestor</p>}
                                </div>
                                <nav className="flex-col p-6 space-y-3 flex">
                                    {filteredNavItems.map((item) => (
                                        <NavLink key={item.href} item={item} mobile />
                                    ))}
                                    <div className="h-px bg-white/10 my-4" />
                                    <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/10 rounded-xl" onClick={handleLogout}>
                                        <LogOut className="w-5 h-5 mr-3" />
                                        <span className="font-bold">Sair</span>
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                        <span className="font-black text-xl tracking-tighter text-gradient uppercase">Viagens</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProfileSettingsDialog>
                            <Avatar className="w-10 h-10 border-2 border-primary/20">
                                <AvatarImage src={user?.avatar_url} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                            </Avatar>
                        </ProfileSettingsDialog>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-10 pt-28 md:pt-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile FAB */}
            <div className="md:hidden fixed bottom-8 right-8 z-40">
                <Link href="/trips/new">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button size="icon" className="h-16 w-16 rounded-2xl shadow-2xl shadow-primary/40 text-primary-foreground font-bold">
                            <Plus className="w-8 h-8" />
                        </Button>
                    </motion.div>
                </Link>
            </div>
        </div>
    );
}
