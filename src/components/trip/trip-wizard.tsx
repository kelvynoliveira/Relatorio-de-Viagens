'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TripSchema, Trip, CampusVisit } from '@/lib/models';
import { useTripStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

import StepGeneral from './wizard-steps/step-general';
import StepItinerary from './wizard-steps/step-itinerary';
import StepReview from './wizard-steps/step-review';

const STEPS = [
    { id: 1, title: 'Dados Gerais', component: StepGeneral },
    { id: 2, title: 'Roteiro', component: StepItinerary },
    { id: 3, title: 'Revisão', component: StepReview },
];

export default function TripWizard({ initialTrip }: { initialTrip?: Trip }) {
    const router = useRouter();
    const { addTrip, updateTrip } = useTripStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<Trip>({
        resolver: zodResolver(TripSchema) as any,
        defaultValues: initialTrip ? structuredClone(initialTrip) : {
            id: generateId(),
            userId: '', // Populated by useEffect async
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            itinerary: [],
            legs: [],
            fuelEntries: [],
            tollEntries: [],
            foodEntries: [],
            mobilityEntries: [],
            hotelEntries: [],
            otherEntries: [],
            plannedFlights: [],
            visits: [],
            title: '',
            originCity: '',
            startDate: '',
            endDate: '',
            notes: '',
        },
        mode: 'onChange',
    });

    const { trigger, handleSubmit, setValue } = form; // Destructure setValue

    useEffect(() => {
        if (!initialTrip) {
            getCurrentUser().then(user => {
                if (user) {
                    setValue('userId', user.id);
                }
            });
        }
    }, [initialTrip, setValue]);

    const handleNext = async () => {
        console.log('[TripWizard] handleNext clicked. Current Step:', currentStep);
        let isValid = false;

        if (currentStep === 1) {
            isValid = await trigger(['title', 'originCity', 'startDate', 'endDate']);
        } else if (currentStep === 2) {
            const itinerary = form.getValues('itinerary');
            if (itinerary.length === 0) {
                toast.error('Adicione pelo menos um campus ao roteiro.');
                return;
            }
            isValid = true;
        } else {
            isValid = true;
        }

        console.log('[TripWizard] Step Valid:', isValid);

        if (isValid) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const onSubmit = async (data: Trip) => {
        console.log('[TripWizard] onSubmit TRIGGERED!', { data, isSubmitting });
        toast.info('DEBUG: Submit disparado!'); // Temporary debug toast

        if (!data.userId) {
            toast.error('Sessão expirada ou usuário não carregado. Tente recarregar a página.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (initialTrip) {
                // ... (existing update logic)
                const existingVisits = data.visits || [];
                const newItineraryIds = data.itinerary.map(i => i.campusId);
                const filteredVisits = existingVisits.filter(v => newItineraryIds.includes(v.campusId));
                const currentVisitCampusIds = filteredVisits.map(v => v.campusId);
                const missingCampusIds = newItineraryIds.filter(id => !currentVisitCampusIds.includes(id));
                const newVisits = missingCampusIds.map(id => ({
                    id: generateId(),
                    campusId: id,
                    status: 'pending' as const,
                    sessions: [],
                    scope: [],
                    photos: [],
                    notes: ''
                }));
                const finalVisits = [...filteredVisits, ...newVisits];

                const updatedTrip = {
                    ...data,
                    visits: finalVisits,
                    updatedAt: new Date().toISOString()
                };

                await updateTrip(initialTrip.id, updatedTrip);
                toast.success('Viagem atualizada com sucesso!');
            } else {
                // CREATE MODE
                const visits = data.itinerary.map(item => ({
                    id: generateId(),
                    campusId: item.campusId,
                    status: 'pending',
                    sessions: [],
                    scope: [],
                    photos: [],
                }));

                const finalTrip: Trip = {
                    ...data,
                    status: 'in_progress' as const,
                    visits: visits as CampusVisit[],
                };

                await addTrip(finalTrip);
                // addTrip in store doesn't throw, but we should verify success before redirecting.
                // However, since we optimistic update, let's just proceed.
            }
            router.push(`/trips/${initialTrip ? initialTrip.id : data.id}`);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar viagem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const CurrentComponent = STEPS[currentStep - 1].component;

    return (
        <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-2xl bg-card/60 backdrop-blur-xl ring-1 ring-white/10">
                <div className="border-b border-white/5 bg-black/20 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-10 h-10 hover:bg-white/10 -ml-2"
                            onClick={() => {
                                if (currentStep > 1) {
                                    handleBack();
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Nova Viagem
                            </h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                {STEPS[currentStep - 1].title}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full border border-white/5">
                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;

                            return (
                                <div
                                    key={step.id}
                                    className={`
                                        w-2.5 h-2.5 rounded-full transition-all duration-300
                                        ${isActive ? 'bg-primary w-8 shadow-[0_0_10px_rgba(var(--primary),0.5)]' : isCompleted ? 'bg-primary/50' : 'bg-white/10'}
                                    `}
                                />
                            );
                        })}
                    </div>
                </div>

                <FormProvider {...form}>
                    <form onSubmit={handleSubmit(onSubmit, (errors) => {
                        console.error('Form Validation Errors:', JSON.stringify(errors, null, 2));
                        console.log('Current Values:', form.getValues());
                        toast.error('Erro de validação! Verifique os campos.');
                    })}>
                        {/* Header Removed - Integrated into Top Bar */}

                        <CardContent className="min-h-[300px] p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: 'circInOut' }}
                                >
                                    <CurrentComponent />
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="flex justify-between border-t border-border/10 pt-6 pb-6 bg-muted/5">
                            <div className="flex gap-2">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                        className="hover:bg-white/5"
                                    >
                                        Voltar
                                    </Button>
                                )}
                            </div>

                            {currentStep < 3 ? (
                                <Button
                                    key="btn-next"
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNext();
                                    }}
                                    className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                >
                                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    key="btn-submit"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    {initialTrip ? 'Salvar Alterações' : 'Confirmar Viagem'}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </FormProvider>
            </Card>
        </div>
    );
}
