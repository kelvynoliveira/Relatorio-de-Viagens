'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 3000);
        };
        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) setIsOffline(true);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {(isOffline || showBackOnline) && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
                >
                    <div className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-xl shadow-2xl transition-colors duration-500",
                        isOffline 
                            ? "bg-red-500/10 border-red-500/20 text-red-400" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}>
                        {isOffline ? (
                            <>
                                <WifiOff className="w-5 h-5 animate-pulse" />
                                <span className="text-sm font-bold tracking-tight">Modo Offline Ativo</span>
                            </>
                        ) : (
                            <>
                                <Wifi className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-tight">Conexão Restaurada!</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
