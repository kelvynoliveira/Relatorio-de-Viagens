'use client';

import { AlertCircle, Camera, PenTool, ArrowRight } from 'lucide-react';
import { useTripStore } from '@/lib/store';
import { ProfileSettingsDialog } from '@/components/profile/profile-settings-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProfileCompletionAlert() {
    const { user } = useTripStore();

    if (!user) return null;

    const hasAvatar = !!user.avatar_url;
    const hasSignature = !!user.signature_url;

    // Only show if missing signature or avatar
    if (hasAvatar && hasSignature) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="overflow-hidden"
            >
                <ProfileSettingsDialog>
                    <button className="w-full group text-left block outline-none">
                        <div className={cn(
                            "relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500",
                            "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
                            "border-amber-500/20 hover:border-amber-500/40",
                            "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                        )}>
                            {/* Animated Background Element */}
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700" />

                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                                    <AlertCircle className="w-7 h-7 text-amber-500 animate-pulse" />
                                </div>

                                <div className="flex-1 space-y-1 text-center md:text-left">
                                    <h3 className="text-lg font-black tracking-tight text-amber-200">
                                        Complete seu perfil de elite
                                    </h3>
                                    <p className="text-amber-500/70 text-sm font-medium leading-relaxed max-w-xl">
                                        {!hasAvatar && !hasSignature 
                                            ? "Sua foto e assinatura digital ainda não foram configuradas. A assinatura é essencial para gerar relatórios." 
                                            : !hasSignature 
                                                ? "Sua assinatura digital é obrigatória para a validação dos relatórios técnicos." 
                                                : "Que tal adicionar uma foto de perfil para personalizar sua experiência?"}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                                    <div className="flex -space-x-3 order-2 sm:order-1">
                                        {!hasAvatar && (
                                            <div className="w-10 h-10 rounded-full bg-black/40 border-2 border-amber-500/30 flex items-center justify-center backdrop-blur-md shadow-lg" title="Foto de perfil pendente">
                                                <Camera className="w-4 h-4 text-amber-500" />
                                            </div>
                                        )}
                                        {!hasSignature && (
                                            <div className="w-10 h-10 rounded-full bg-black/40 border-2 border-amber-500/30 flex items-center justify-center backdrop-blur-md shadow-lg" title="Assinatura pendente">
                                                <PenTool className="w-4 h-4 text-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-12 px-6 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:bg-amber-400 transition-colors shadow-xl shadow-amber-500/20 order-1 sm:order-2 w-full sm:w-auto justify-center">
                                        Configurar Agora
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                </ProfileSettingsDialog>
            </motion.div>
        </AnimatePresence>
    );
}
