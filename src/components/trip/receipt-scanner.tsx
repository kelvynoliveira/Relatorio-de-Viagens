'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, ScanLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { parseReceiptText, ParsedReceipt } from '@/lib/ocr-parser';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { PhotoEntry } from '@/lib/models';

interface ReceiptScannerProps {
  onScanComplete: (data: ParsedReceipt, photo: PhotoEntry) => void;
  className?: string;
}

export function ReceiptScanner({ onScanComplete, className }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    
    // Clear input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    processAndUpload(file);
  };

  const processAndUpload = async (file: File) => {
    setIsScanning(true);
    try {
      // 1. OCR Processing (Server Side)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64Promise;
      const base64Content = base64Image.split(',')[1];

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Content }),
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Falha na comunicação com o servidor de OCR');
      }
      const { text } = await ocrResponse.json();
      const parsedData = parseReceiptText(text);

      // 2. Upload to Supabase Storage (consistent with PhotoUploader)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${generateId()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trip-photos')
        .getPublicUrl(filePath);

      const newPhoto: PhotoEntry = {
        id: generateId(),
        url: publicUrl,
        timestamp: new Date().toISOString(),
        tags: [],
        description: 'Recibo (Auto-scan)'
      };

      toast.success('Recibo processado e salvo!');
      onScanComplete(parsedData, newPhoto);
      
      setTimeout(() => {
        setPreviewUrl(null);
        setIsScanning(false);
      }, 1500);

    } catch (error: any) {
      console.error('OCR/Upload Error:', error);
      toast.error(error.message || 'Erro ao processar. Tente novamente.');
      setIsScanning(false);
      setPreviewUrl(null);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 border-primary/30 hover:border-primary bg-primary/5 h-12"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        {isScanning ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-primary" />
        )}
        <span>{isScanning ? 'Lendo Recibo...' : 'Escanear Recibo'}</span>
      </Button>

      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <div className="relative max-w-md w-full aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Scanning Animation */}
              {isScanning && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(147,51,234,0.8)] z-10 flex items-center justify-center"
                >
                  <div className="absolute -top-6 text-primary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                    Analizando Dados...
                  </div>
                </motion.div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <ScanLine className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Processamento Inteligente</h3>
                    <p className="text-white/60 text-xs">Extraindo valores e data do comprovante</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
