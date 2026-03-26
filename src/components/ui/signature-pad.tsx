'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './button';
import { Eraser, Check, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SignaturePad({ onSave, onClear, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FFFFFF'; // White for dark mode, will handle transparency on save
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
        </div>

        {isEmpty && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/20 select-none">
            <div className="flex flex-col items-center gap-2">
                <MousePointer2 className="w-6 h-6 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-[0.2em]">Assine aqui</p>
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
