'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Supabase handles the session from the URL fragment automatically when the client loads.
    // However, if we're on this page and there's no session, it might be an invalid link.
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
            toast.error('Senhas não coincidem');
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
                toast.success('Senha atualizada com sucesso!');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            }
        } catch (err) {
            toast.error('Erro inesperado ao redefinir senha');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="max-w-md w-full shadow-lg border-2">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                        <Car className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Nova Senha</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Digite sua nova senha de acesso abaixo.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                                <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Atualizando...
                                </>
                            ) : (
                                'Redefinir Senha'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
