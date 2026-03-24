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
                toast.success('Login realizado com sucesso');
                // Force hard reload to ensure auth state is fresh
                window.location.href = '/dashboard';
            }
        } catch (err) {
            toast.error('Erro inesperado ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full" />
            
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-md w-full z-10"
            >
                <Card className="glass-card border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="text-center space-y-6 pt-12 pb-10">
                        <motion.div 
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20 group"
                        >
                            <Car className="w-10 h-10 text-primary transition-transform group-hover:scale-110 duration-500" />
                        </motion.div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl md:text-4xl font-black tracking-tighter">
                                <span className="text-gradient">Viagens</span> Técnicas
                            </CardTitle>
                            <CardDescription className="text-base font-medium text-muted-foreground/80">
                                Faça login para acessar sua plataforma premium
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-12">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@e-mail.com.br"
                                    required
                                    className="h-12 bg-white/5 border-white/5 rounded-2xl px-4 focus-visible:ring-primary/30 transition-all"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Senha</Label>
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Esqueceu a senha?
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
                            </div>
    
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
                                        Autenticando...
                                    </>
                                ) : (
                                    'Acessar Dashboard'
                                )}
                            </MotionButton>
                        </form>
                    </CardContent>
                </Card>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]"
                >
                    Plataforma de Gestão de Viagens v2.0
                </motion.p>
            </motion.div>
        </div>
    );
}
