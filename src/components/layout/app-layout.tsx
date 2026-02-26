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
import { supabase } from '@/lib/supabase';
import { logout, getCurrentUser, User } from '@/lib/auth';
import { cn, formatUserName } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTripStore } from '@/lib/store';
import { ProfileSettingsDialog } from '@/components/profile/profile-settings-dialog';

const BASE_NAV_ITEMS = [
    { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['user', 'admin'] },
    { href: '/trips', label: 'Minhas Viagens', icon: Map, roles: ['user', 'admin'] },
    { href: '/manager/tracking', label: 'Acompanhar Viagens', icon: Users, roles: ['admin'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const { user, trips } = useTripStore();

    const handleLogout = async () => {
        await logout();
    };

    const userRole = user?.role || 'user';
    const filteredNavItems = BASE_NAV_ITEMS.filter(item => {
        if (!item.roles.includes(userRole)) return false;

        // Hide "Minhas Viagens" from sidebar if there are no trips created yet
        // This avoids confusion with the empty state in the Dashboard
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
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                    isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                <item.icon className="w-4 h-4" />
                {item.label}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border bg-card/50 backdrop-blur-xl fixed top-4 left-4 h-[calc(100vh-2rem)] z-30 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">V</div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-none">Viagens</span>
                        {userRole === 'admin' && <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Gestor</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <NavLink key={item.href} item={item} />
                    ))}
                </nav>

                <div className="p-4 border-t space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <ProfileSettingsDialog>
                                <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={user?.avatar_url} className="object-cover" />
                                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                                </Avatar>
                            </ProfileSettingsDialog>
                            <div className="text-xs overflow-hidden">
                                <p className="font-medium truncate max-w-[100px]">{formatUserName(user?.name)}</p>
                                <p className="text-muted-foreground truncate max-w-[100px]">{user?.email || '...'}</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-[18rem] flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:hidden">
                    <div className="flex items-center gap-3">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" suppressHydrationWarning>
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
                                <div className="p-6 border-b">
                                    <span className="font-bold text-lg">Menu {userRole === 'admin' && '(Gestor)'}</span>
                                </div>
                                <nav className="flex-col p-4 space-y-2 flex">
                                    {filteredNavItems.map((item) => (
                                        <NavLink key={item.href} item={item} mobile />
                                    ))}
                                    <div className="h-px bg-border my-4" />
                                    <Button variant="ghost" className="justify-start text-red-500" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sair
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                        <span className="font-semibold text-sm">Viagens Técnicas</span>
                    </div>
                    <ProfileSettingsDialog>
                        <Avatar className="w-8 h-8 cursor-pointer">
                            <AvatarImage src={user?.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                        </Avatar>
                    </ProfileSettingsDialog>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                    {children}
                </main>
            </div>

            {/* Mobile FAB */}
            <div className="md:hidden fixed bottom-6 right-6 z-40">
                <Link href="/trips/new">
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg shadow-primary/30">
                        <Plus className="w-6 h-6" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
