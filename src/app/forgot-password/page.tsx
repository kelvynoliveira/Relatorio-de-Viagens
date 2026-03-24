'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

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
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
            <Card className="max-w-md w-full shadow-lg border-2">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                        <Car className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {isSent 
                                ? 'Enviamos as instruções para o seu e-mail.' 
                                : 'Informe seu e-mail para receber o link de recuperação.'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {!isSent ? (
                        <form onSubmit={handleResetRequest} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu.email@animaeducacao.com.br"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando link...
                                    </>
                                ) : (
                                    'Enviar Link de Recuperação'
                                )}
                            </Button>

                            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-4">
                                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
                            </Link>
                        </form>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="p-4 bg-primary/10 rounded-xl">
                                <p className="text-sm text-primary font-medium">
                                    Verifique a sua caixa de entrada e siga as instruções para redefinir sua senha.
                                </p>
                            </div>
                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
