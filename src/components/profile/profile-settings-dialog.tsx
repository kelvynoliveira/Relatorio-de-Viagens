'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useTripStore } from '@/lib/store';
import { toast } from 'sonner';
import { Loader2, Camera, Upload } from 'lucide-react';
import { formatUserName } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
            <DialogContent className="sm:max-w-md bg-zinc-950/90 border-zinc-800 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Editar Perfil</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    <div className="relative group">
                        <Avatar className="w-32 h-32 border-4 border-zinc-900 shadow-xl">
                            <AvatarImage src={previewUrl || user?.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                {formatUserName(user?.name).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                        >
                            <Camera className="w-5 h-5" />
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

                    <div className="text-center space-y-1">
                        <h3 className="font-medium text-lg">{formatUserName(user?.name)}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2 border-t border-white/5 pt-4 mt-2">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={uploading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="shadow-lg shadow-primary/20"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Salvar Foto
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
