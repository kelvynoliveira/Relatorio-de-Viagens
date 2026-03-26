'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Eraser, Check, MousePointer2, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SignaturePad({ onSave, onClear, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FFFFFF'; 
    ctx.lineWidth = 2.5;
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Clear and draw processed image
        clear();
        
        // Calculate aspect ratio fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width / 2) - (img.width * scale / 2);
        const y = (canvas.height / 2) - (img.height * scale / 2);

        // Temp canvas for processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tCtx = tempCanvas.getContext('2d');
        if (!tCtx) return;

        tCtx.drawImage(img, 0, 0);
        const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Smart Background Removal (Paper to Transparent)
        // Convert to White signature on Transparent background for the App view
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Luminance threshold (200 is typical for white/gray paper)
          const brightness = (r + g + b) / 3;
          if (brightness > 180) {
            data[i + 3] = 0; // Transparent
          } else {
            // Make traits white for the dark app interface
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255; // Opaque
          }
        }

        tCtx.putImageData(imageData, 0, 0);
        
        // Draw the processed signature to main canvas
        // Need to undo the scale translation for direct drawImage
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(tempCanvas, x, y, img.width * scale, img.height * scale);
        ctx.restore();
        
        setIsEmpty(false);
        toast.success("Imagem processada com sucesso!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Create a temporary canvas to handle transparency and color for the signature (black for PDF)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw the signature in black on the temp canvas
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = '#000000'; // Final signature is black for the PDF
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    onSave(tempCanvas.toDataURL('image/png'));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 cursor-crosshair touch-none"
          style={{ width: '100%', height: '192px' }}
        />
        
        <div className="absolute top-3 right-3 flex gap-2">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={clear}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/5"
            title="Limpar"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/5"
            title="Upload de Imagem"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        {isEmpty && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/20 select-none px-6 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <MousePointer2 className="w-5 h-5 opacity-40 ml-2" />
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Desenhe</p>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10" />
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 opacity-40" />
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Ou suba uma foto</p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground/60 max-w-[200px]">
                  Dica: Use papel branco e caneta preta para o melhor processamento automático.
                </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button 
          onClick={handleSave} 
          disabled={isEmpty}
          className="w-full md:w-auto bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}
