'use client';

import { useState } from 'react';
import { Button, MotionButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as any
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast.error('Erro ao enviar e-mail', {
                    description: error.message
                });
            } else {
                setIsSent(true);
                toast.success('E-mail enviado com sucesso');
            }
        } catch (err) {
            toast.error('Erro inesperado ao solicitar recuperação');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-premium-gradient p-4 antialiased overflow-hidden relative">
            {/* Theme Toggle (Guest) */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md z-10"
            >
                <Card className="border-0 shadow-2xl glass-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="text-center space-y-6 pb-8 pt-10">
                        <motion.div 
                            variants={itemVariants}
                            className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40"
                        >
                            <Car className="w-10 h-10 text-primary-foreground stroke-[2.5]" />
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-2">
                            <CardTitle className="text-4xl font-black tracking-tighter text-foreground">
                                {isSent ? 'Sucesso!' : 'Recuperar'} <span className="text-gradient">Senha</span>
                            </CardTitle>
                            <CardDescription className="text-lg font-medium text-muted-foreground/80 px-4">
                                {isSent 
                                    ? 'Enviamos as instruções para o seu e-mail corporativo.' 
                                    : 'Informe seu e-mail para receber o link de recuperação estratégica.'}
                            </CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="pb-10 px-8">
                        <AnimatePresence mode="wait">
                            {!isSent ? (
                                <motion.form 
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleResetRequest} 
                                    className="space-y-6"
                                >
                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <Label htmlFor="email" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                                        <div className="relative group">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="seu.email@animaeducacao.com.br"
                                                required
                                                className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium placeholder:text-muted-foreground/30"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                            <Mail className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <MotionButton 
                                            type="submit" 
                                            className="w-full h-14 text-lg font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all bg-primary hover:bg-primary/90 mt-2" 
                                            disabled={isLoading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                'Enviar Link de Recuperação'
                                            )}
                                        </MotionButton>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="text-center">
                                        <Link href="/login" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all group" legacyBehavior>
                                            <a className="flex items-center gap-2">
                                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Voltar para o Login
                                            </a>
                                        </Link>
                                    </motion.div>
                                </motion.form>
                            ) : (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8 text-center"
                                >
                                    <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 shadow-inner">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                        <p className="text-lg font-bold text-emerald-400 leading-tight">
                                            Verifique sua caixa de entrada. Segue as instruções para redefinir sua senha com segurança.
                                        </p>
                                    </div>
                                    <Link href="/login" className="block">
                                        <MotionButton 
                                            variant="outline" 
                                            className="w-full h-14 text-lg font-black rounded-2xl border-primary/10 hover:bg-primary/5 transition-all text-foreground"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <ArrowLeft className="w-5 h-5 mr-3" /> Voltar para o Login
                                        </MotionButton>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
