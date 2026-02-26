'use client';

import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Car,
    Fuel,
    Receipt,
    UtensilsCrossed,
    Coins,
    ChevronRight,
    ArrowRight,
    CheckCircle2,
    Map
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExpenseWizardDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLaunch: (category: string) => void;
}

const STEPS = [
    { id: 'leg', question: 'Teve deslocamento entre cidades?', sub: 'Registre a quilometragem (estrada) ou trecho aéreo', icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-500/10', cmd: 'leg' },
    { id: 'mobility', question: 'Precisou de Uber ou Táxi?', sub: 'Deslocamento urbano no destino', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10', cmd: 'mobility' },
    { id: 'fuel', question: 'Abasteceu o veículo?', sub: 'Gasolina, Álcool ou Diesel', icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-500/10', cmd: 'fuel' },
    { id: 'toll', question: 'Pagou algum pedágio?', sub: 'Registros individuais por praça', icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10', cmd: 'toll' },
    { id: 'food', question: 'Gastou com alimentação?', sub: 'Almoço, Janta ou Lanches', icon: UtensilsCrossed, color: 'text-red-500', bg: 'bg-red-500/10', cmd: 'food' },
    { id: 'other', question: 'Teve algum outro gasto?', sub: 'Materiais, Estacionamento, etc.', icon: Coins, color: 'text-gray-500', bg: 'bg-gray-500/10', cmd: 'other' },
];

export default function ExpenseWizardDrawer({ open, onOpenChange, onLaunch }: ExpenseWizardDrawerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [hasAddedThisStep, setHasAddedThisStep] = useState(false);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            setHasAddedThisStep(false);
        } else {
            onOpenChange(false);
            // Reset for next time
            setTimeout(() => {
                setCurrentStep(0);
                setHasAddedThisStep(false);
            }, 300);
        }
    };

    const handleSim = () => {
        onLaunch(STEPS[currentStep].cmd);
        setHasAddedThisStep(true);
        // We STAY on the same step to allow multiple additions
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;
    const step = STEPS[currentStep];

    const questionText = hasAddedThisStep
        ? step.question.replace('Você teve', 'Teve **mais algum**').replace('Você abasteceu', 'Abasteceu **novamente**').replace('Pagou algum', 'Pagou **mais algum**').replace('Registrou todos os', 'Mais algum')
        : step.question;

    // Fallback for simple replacements if regex/replace is complex to maintain
    const dynamicQuestion = hasAddedThisStep
        ? `Teve mais algum gasto com ${step.id === 'food' ? 'alimentação' : step.id === 'mobility' ? 'mobilidade' : step.id === 'toll' ? 'pedágio' : step.id === 'fuel' ? 'abastecimento' : step.id === 'leg' ? 'deslocamento' : 'outros'}?`
        : step.question;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] outline-none">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Passo {currentStep + 1} de {STEPS.length}</span>
                            <span className={cn("text-xs font-bold", step.color)}>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 mb-8 bg-white/10" indicatorClassName={step.bg.replace('/10', '')} />

                        <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 shadow-2xl ring-1 ring-inset ring-white/10", step.bg)}>
                            <step.icon className={cn("w-10 h-10 drop-shadow-lg", step.color)} />
                        </div>

                        <DrawerTitle className="text-3xl font-black leading-tight text-white">
                            {dynamicQuestion}
                        </DrawerTitle>
                        <DrawerDescription className="text-lg mt-3 text-muted-foreground font-medium">
                            {step.sub}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-6 pt-4 space-y-4">
                        <Button
                            onClick={handleSim}
                            className={cn(
                                "w-full h-16 text-lg font-bold shadow-xl transition-all duration-300 group ring-1 ring-inset ring-white/20",
                                step.bg.replace('/10', ''), // Use solid color derived from bg class
                                "text-white hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            Sim, registrar
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleNext}
                            className="w-full h-14 text-base font-medium bg-transparent border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                        >
                            {hasAddedThisStep ? 'Próxima etapa' : 'Não / Pular'}
                        </Button>
                    </div>

                    <DrawerFooter className="pb-8">
                        <DrawerClose asChild>
                            <Button variant="ghost" className="text-muted-foreground/50 hover:text-white">Cancelar e sair</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
