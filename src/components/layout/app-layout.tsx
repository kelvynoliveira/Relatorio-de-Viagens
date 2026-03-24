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
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                        isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                >
                    <item.icon className={cn("w-4 h-4", isActive ? "" : "group-hover:text-primary")} />
                    {item.label}
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
                className="hidden md:flex w-[280px] flex-col glass-card fixed top-4 left-4 h-[calc(100vh-2rem)] z-30 rounded-3xl shadow-2xl overflow-hidden border-0"
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

                <div className="p-4 m-4 rounded-2xl bg-muted/30 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <ProfileSettingsDialog>
                                <Avatar className="w-10 h-10 cursor-pointer border-2 border-primary/20 hover:border-primary transition-all shadow-md">
                                    <AvatarImage src={user?.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                                </Avatar>
                            </ProfileSettingsDialog>
                            <div className="text-xs">
                                <p className="font-bold truncate max-w-[120px]">{formatUserName(user?.name)}</p>
                                <p className="text-muted-foreground truncate max-w-[120px] text-[10px] uppercase tracking-tighter">{user?.role || 'Viajante'}</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all" 
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span className="font-medium">Sair</span>
                    </Button>
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
                    <ProfileSettingsDialog>
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarImage src={user?.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                        </Avatar>
                    </ProfileSettingsDialog>
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
