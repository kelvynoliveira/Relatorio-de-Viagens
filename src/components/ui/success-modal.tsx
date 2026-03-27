'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LottiePlayer from './lottie-player';
import { Button } from './button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, title, message }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-sky-500" />
            
            <div className="w-48 h-48 mx-auto -mb-4 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                    <motion.svg
                        viewBox="0 0 24 24"
                        className="w-12 h-12 text-emerald-500 fill-none stroke-current"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <motion.path
                            d="M20 6L9 17L4 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                        />
                    </motion.svg>
                </motion.div>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
            <p className="text-muted-foreground mb-8">{message}</p>

            <Button 
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full h-14"
            >
                Excelente!
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
