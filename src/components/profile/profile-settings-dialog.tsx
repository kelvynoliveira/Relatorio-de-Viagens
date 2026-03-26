'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button, MotionButton } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useTripStore } from '@/lib/store';
import { toast } from 'sonner';
import { Loader2, Camera, Upload } from 'lucide-react';
import { formatUserName } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SignaturePad } from '@/components/ui/signature-pad';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, PenTool } from 'lucide-react';

interface ProfileSettingsDialogProps {
    children: React.ReactNode;
}

export function ProfileSettingsDialog({ children }: ProfileSettingsDialogProps) {
    const { user, setUser, refreshData } = useTripStore();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<string>('profile');
    const [isSavingSignature, setIsSavingSignature] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            setFile(null);
            setPreviewUrl(null);
            return;
        }
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!user || !file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `avatars/${user.id}-${Math.random()}.${fileExt}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile Logic
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Update Local State
            setUser({ ...user, avatar_url: publicUrl });
            toast.success('Foto de perfil atualizada!');
            setFile(null);
            setPreviewUrl(null);

            // Force data refresh
            refreshData();
            router.refresh();

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao atualizar foto');
        } finally {
            setUploading(false);
        }
    };

    const handleSignatureSave = async (dataUrl: string) => {
        if (!user) return;

        try {
            setIsSavingSignature(true);
            
            // Convert data URL to Blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `signature-${user.id}.png`, { type: 'image/png' });

            const filePath = `signatures/${user.id}-${Date.now()}.png`;

            // 1. Upload to Storage (Using 'avatars' bucket as fallback if 'signatures' doesn't exist yet, 
            // but assuming developer will create it or use existing one)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile Logic
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ signature_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Update Local State
            setUser({ ...user, signature_url: publicUrl });
            toast.success('Assinatura salva com sucesso!');
            
            refreshData();
            router.refresh();

        } catch (error: any) {
            console.error('Error saving signature:', error);
            toast.error('Erro ao salvar assinatura');
        } finally {
            setIsSavingSignature(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-white/5">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter text-white">Editar <span className="text-gradient">Perfil</span></DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/20 rounded-xl mb-6">
                        <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary/20"><User className="w-4 h-4 mr-2" />Perfil</TabsTrigger>
                        <TabsTrigger value="signature" className="rounded-lg data-[state=active]:bg-primary/20"><PenTool className="w-4 h-4 mr-2" />Assinatura</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-0">
                        <div className="flex flex-col items-center gap-6 py-4">
                            <div className="relative group">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Avatar className="w-40 h-40 border-8 border-white/5 shadow-2xl relative overflow-hidden">
                                        <AvatarImage src={previewUrl || user?.avatar_url} className="object-cover" />
                                        <AvatarFallback className="text-5xl font-black bg-gradient-to-br from-primary to-purple-600 text-white">
                                            {formatUserName(user?.name).substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </Avatar>
                                </motion.div>
                                <Label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-2 right-2 p-3 bg-primary text-primary-foreground rounded-2xl cursor-pointer hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 group-hover:scale-110 active:scale-95"
                                >
                                    <Camera className="w-6 h-6 stroke-[2.5]" />
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </Label>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="font-black text-2xl tracking-tight text-white">{formatUserName(user?.name)}</h3>
                                <p className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">{user?.email}</p>
                            </div>

                            <div className="w-full pt-4">
                                <MotionButton
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="w-full rounded-xl h-12 font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Upload className="w-4 h-4 mr-2" />
                                    )}
                                    Salvar Alterações
                                </MotionButton>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="signature" className="mt-0">
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sua Assinatura Atual</Label>
                                <div className="h-32 w-full rounded-xl border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden">
                                    {user?.signature_url ? (
                                        <img src={user.signature_url} alt="Assinatura" className="h-24 invert dark:invert-0 object-contain" />
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Nenhuma assinatura cadastrada</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nova Assinatura</Label>
                                <SignaturePad 
                                    onSave={handleSignatureSave}
                                    className={isSavingSignature ? "opacity-50 pointer-events-none" : ""} 
                                />
                                {isSavingSignature && (
                                    <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Salvando...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
