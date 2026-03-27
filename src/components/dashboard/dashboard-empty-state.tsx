'use client';

import { motion } from 'framer-motion';
import { Plus, Compass, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LottiePlayer from '@/components/ui/lottie-player';

interface DashboardEmptyStateProps {
    userName?: string;
}

export default function DashboardEmptyState({ userName }: DashboardEmptyStateProps) {
    const rawName = userName?.split(' ')[0].split('.')[0] || 'Viajante';
    const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-primary/20 bg-muted/5 relative overflow-hidden group"
        >
            {/* Animated background elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -120, 0],
                    opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-sky-500/10 rounded-full blur-3xl -z-10"
            />

            {/* Icon Container with Native Animation */}
            <div className="relative mb-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner group-hover:border-primary/40 transition-colors overflow-hidden relative"
                >
                    {/* Native Paper Plane SVG Animation */}
                    <motion.svg
                        viewBox="0 0 24 24"
                        className="w-16 h-16 text-primary fill-none stroke-current"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ x: -10, y: 10, opacity: 0 }}
                        animate={{ 
                            x: [0, 5, 0], 
                            y: [0, -5, 0],
                            opacity: 1,
                            rotate: [-2, 2, -2]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                    </motion.svg>
                    
                    {/* "Wind" lines */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-primary/20 h-[1px] rounded-full"
                            style={{ 
                                width: 20 + i * 10,
                                left: -40,
                                top: 40 + i * 15
                            }}
                            animate={{ x: [0, 200], opacity: [0, 1, 0] }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                delay: i * 0.6,
                                ease: "linear"
                            }}
                        />
                    ))}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="absolute -top-2 -right-2 bg-background rounded-full p-2 shadow-xl border border-border"
                >
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                </motion.div>
            </div>

            {/* Text Content */}
            <div className="max-w-md space-y-4 relative z-10">
                <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {firstName}, sua jornada começa aqui
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Você ainda não tem nenhuma viagem registrada. Organize seus itinerários, gerencie seus custos e acompanhe suas atividades em um só lugar.
                </p>
            </div>

            {/* CTA */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-10"
            >
                <Link href="/trips/new">
                    <Button size="lg" className="px-8 rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 h-14 text-base font-semibold transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Criar minha primeira viagem
                    </Button>
                </Link>
            </motion.div>

            {/* Subtle Guide Line */}
            <div className="mt-8 pt-8 border-t border-border/50 w-full max-w-xs">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                    Explorar Viagens
                </p>
            </div>
        </motion.div>
    );
}
