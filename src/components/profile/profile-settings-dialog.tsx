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
import { motion } from 'framer-motion';

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
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

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
            setIsOpen(false);
            setFile(null);
            setPreviewUrl(null);

            // Force data refresh to ensure sidebar catches up if needed
            refreshData();
            router.refresh();

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao atualizar foto');
        } finally {
            setUploading(false);
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

                <div className="flex flex-col items-center gap-6 py-8">
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
                </div>

                <DialogFooter className="sm:justify-between gap-4 border-t border-white/5 pt-6 mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={uploading}
                        className="rounded-xl font-bold"
                    >
                        Cancelar
                    </Button>
                    <MotionButton
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="rounded-xl px-8 font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2 stroke-[3]" />
                                Salvar Foto
                            </>
                        )}
                    </MotionButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
