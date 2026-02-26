'use client';

import { Plus, Fuel, Coins, Utensils, Car, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingQuickActionsProps {
    onAction: (type: 'fuel' | 'toll' | 'food' | 'leg' | 'other') => void;
    readonly?: boolean;
}

export default function FloatingQuickActions({ onAction, readonly = false }: FloatingQuickActionsProps) {
    if (readonly) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-110 transition-transform flex items-center justify-center">
                        <Plus className="w-8 h-8" />
                        <span className="sr-only">Ações Rápidas</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mb-4">
                    <DropdownMenuItem onClick={() => onAction('leg')} className="flex items-center gap-2 p-3 cursor-pointer">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Car className="w-4 h-4" />
                        </div>
                        <span>Novo Trecho / Mobilidade</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('fuel')} className="flex items-center gap-2 p-3 cursor-pointer">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                            <Fuel className="w-4 h-4" />
                        </div>
                        <span>Abastecimento</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('toll')} className="flex items-center gap-2 p-3 cursor-pointer">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <Coins className="w-4 h-4" />
                        </div>
                        <span>Pedágio</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('food')} className="flex items-center gap-2 p-3 cursor-pointer">
                        <div className="bg-red-100 p-2 rounded-full text-red-600">
                            <Utensils className="w-4 h-4" />
                        </div>
                        <span>Alimentação</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('other')} className="flex items-center gap-2 p-3 cursor-pointer">
                        <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                        </div>
                        <span>Outros Gastos</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
