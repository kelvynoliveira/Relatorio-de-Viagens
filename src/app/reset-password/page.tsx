'use client';

import { useState, useEffect } from 'react';
import { Button, MotionButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Link inválido ou expirado', {
                    description: 'Por favor, solicite uma nova recuperação de senha.'
                });
                router.push('/forgot-password');
            }
        };
        checkSession();
    }, [router]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                toast.error('Erro ao atualizar senha', {
                    description: error.message
                });
            } else {
                setIsSuccess(true);
                toast.success('Senha atualizada com sucesso!');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err) {
            toast.error('Erro inesperado ao redefinir senha');
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
                            <Lock className="w-10 h-10 text-primary-foreground stroke-[2.5]" />
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-2">
                            <CardTitle className="text-4xl font-black tracking-tighter text-foreground">
                                {isSuccess ? 'Senha' : 'Nova'} <span className="text-gradient">Senha</span>
                            </CardTitle>
                            <CardDescription className="text-lg font-medium text-muted-foreground/80 px-4">
                                {isSuccess 
                                    ? 'Sua senha foi atualizada com sucesso. Redirecionando...'
                                    : 'Defina uma nova senha de acesso segurara para sua conta.'}
                            </CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="pb-10 px-8">
                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.form 
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    onSubmit={handleResetPassword} 
                                    className="space-y-6"
                                >
                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <Label htmlFor="password" title="Mínimo 6 caracteres" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</Label>
                                        <div className="relative group">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••"
                                                required
                                                className="h-14 pl-12 pr-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium placeholder:text-muted-foreground/30"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                            <Lock className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-4.5 text-muted-foreground hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-3">
                                        <Label htmlFor="confirmPassword" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Senha</Label>
                                        <div className="relative group">
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••"
                                                required
                                                className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium placeholder:text-muted-foreground/30"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                            <Lock className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                                                    Atualizando...
                                                </>
                                            ) : (
                                                'Redefinir Senha'
                                            )}
                                        </MotionButton>
                                    </motion.div>
                                </motion.form>
                            ) : (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8 text-center py-4"
                                >
                                    <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 shadow-inner">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                        <p className="text-lg font-bold text-emerald-400 leading-tight">
                                            Senha redefinida com sucesso! Redirecionando você para o login em instantes...
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
