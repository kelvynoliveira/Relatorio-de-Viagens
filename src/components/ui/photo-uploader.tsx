'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoEntry, PhotoTagEnum } from "@/lib/models";
import { generateId } from "@/lib/utils";
import { Camera, Trash2, Link as LinkIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface PhotoUploaderProps {
    value: PhotoEntry[];
    onChange: (photos: PhotoEntry[]) => void;
}

export function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 1. Validation: Max 5MB
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error('A imagem é muito grande. Máximo 5MB.');
            return;
        }

        console.log(`[PhotoUploader] Starting upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        setIsUploading(true);

        try {
            // 2. Create unique path
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${generateId()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            // 3. Upload to Supabase Storage with timeout
            console.log(`[PhotoUploader] Target Bucket: 'trip-photos', Path: ${filePath}, Type: ${file.type}`);

            // Promise centered timeout (60 seconds)
            const uploadPromise = supabase.storage
                .from('trip-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de 60s atingido. Verifique sua conexão. Se o primeiro funcionou e este falhou, tente atualizar a página (Ctrl+F5).')), 60000)
            );

            console.log('[PhotoUploader] Executing upload request...');
            const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

            if (uploadError) {
                console.error('[PhotoUploader] Upload error details:', uploadError);
                throw uploadError;
            }

            console.log('[PhotoUploader] Upload successful, data:', data);

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('trip-photos')
                .getPublicUrl(filePath);

            console.log('[PhotoUploader] Public URL:', publicUrl);

            // 5. Update State
            const newPhoto: PhotoEntry = {
                id: generateId(),
                url: publicUrl,
                timestamp: new Date().toISOString(),
                tags: [],
                description: ''
            };

            onChange([...value, newPhoto]);
            toast.success('Upload concluído!');

        } catch (error: any) {
            console.error('[PhotoUploader] Critical upload failure:', error);
            toast.error(`Falha no upload: ${error.message}`);
        } finally {
            setIsUploading(false);
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(p => p.id !== id));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Comprovantes / Fotos</Label>

            <div className="flex gap-2">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={triggerFileInput}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all h-10"
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Enviando...' : 'Adicionar Foto'}
                </Button>
            </div>

            {value.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {value.map((photo) => (
                        <div key={photo.id} className="group relative flex flex-col gap-1.5">
                            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border border-white/10 shadow-sm transition-all hover:border-primary/50">
                                {/* In real app, use Next.js Image or img tag */}
                                <img src={photo.url} alt={photo.description || "Comprovante"} className="object-cover w-full h-full" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => handleRemove(photo.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <Input
                                placeholder="Legenda (ex: Antes)"
                                value={photo.description || ''}
                                onChange={(e) => {
                                    const newDescription = e.target.value;
                                    const newPhotos = value.map(p => p.id === photo.id ? { ...p, description: newDescription } : p);
                                    onChange(newPhotos);
                                }}
                                className="h-7 text-[10px] px-2 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/40 focus:bg-black/40 focus:border-primary/30 transition-all rounded-md text-center font-medium"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
