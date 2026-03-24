'use client';

import { useState } from 'react';
import { Button, MotionButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { login } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as any,
            staggerChildren: 0.1
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

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await login(email, password);

            if (error) {
                toast.error('Falha no login', {
                    description: 'Verifique suas credenciais e tente novamente.'
                });
            } else {
                toast.success('Bem-vindo de volta!', {
                    description: 'Acessando seu painel de viagens...'
                });
                router.push('/dashboard');
            }
        } catch (err) {
            toast.error('Ocorreu um erro inesperado');
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
                <div className="text-center mb-8 space-y-4">
                    <motion.div 
                        variants={itemVariants}
                        className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 hover:rotate-0 transition-transform duration-500"
                    >
                        <Car className="w-10 h-10 text-primary-foreground stroke-[2.5]" />
                    </motion.div>
                    <motion.div variants={itemVariants} className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter text-white">
                            Viagens <span className="text-gradient">Técnicas</span>
                        </h1>
                        <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Ânima Educação</p>
                    </motion.div>
                </div>

                <Card className="border-0 shadow-2xl glass-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="space-y-1 pb-8 pt-10 px-8">
                        <CardTitle className="text-3xl font-black tracking-tight text-white">Login</CardTitle>
                        <CardDescription className="text-base font-medium text-muted-foreground/60">
                            Acesse sua conta para gerenciar deslocamentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-10 px-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <motion.div variants={itemVariants} className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu.email@animaeducacao.com.br"
                                    required
                                    className="h-12 bg-white/5 border-white/5 rounded-2xl px-4 focus-visible:ring-primary/30 transition-all font-medium"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </motion.div>
                            <motion.div variants={itemVariants} className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" title="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Senha</Label>
                                    <Link href="/forgot-password" title="recuperar senha" legacyBehavior>
                                        <a className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Esqueceu a senha?</a>
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="h-12 bg-white/5 border-white/5 rounded-2xl px-4 pr-12 focus-visible:ring-primary/30 transition-all"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <Lock className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <MotionButton
                                    type="submit"
                                    className="w-full h-14 text-lg font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all bg-primary hover:bg-primary/90 mt-4"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Entrando...
                                        </>
                                    ) : (
                                        'Acessar Plataforma'
                                    )}
                                </MotionButton>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
                
                <motion.div 
                    variants={itemVariants}
                    className="mt-8 text-center"
                >
                    <p className="text-sm font-medium text-muted-foreground/40 italic">
                        Plataforma Exclusiva para Colaboradores Ânima
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
