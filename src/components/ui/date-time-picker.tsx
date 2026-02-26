"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    disabled?: boolean
    showTime?: boolean
}

export function DateTimePicker({ date, setDate, disabled, showTime = true }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    React.useEffect(() => {
        setSelectedDate(date)
    }, [date])

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) {
            setSelectedDate(undefined)
            setDate(undefined)
            return
        }

        const newDate = new Date(day)
        if (selectedDate && showTime) {
            newDate.setHours(selectedDate.getHours())
            newDate.setMinutes(selectedDate.getMinutes())
        } else if (showTime) {
            const now = new Date()
            newDate.setHours(now.getHours())
            newDate.setMinutes(now.getMinutes())
        } else {
            // If time is disabled, standardizing to noon or start of day might be safer, 
            // but keeping local time is usually fine for display. 
            // Let's keep 00:00:00 for strict date only or preserve generic behavior.
            newDate.setHours(12, 0, 0, 0); // Noon to avoid timezone edge cases on simple date
        }
        setSelectedDate(newDate)
        setDate(newDate)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal border-border bg-background/50 hover:bg-background/80 transition-colors",
                        !date && "text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date && isValid(date) ? (
                        <span className="capitalize">
                            {format(date, showTime ? "PPP 'às' HH:mm" : "PPP", { locale: ptBR })}
                        </span>
                    ) : (
                        <span>{showTime ? "Selecione data e hora..." : "Selecione uma data..."}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                />
                {showTime && (
                    <div className="p-3 border-t border-border bg-muted/20">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <Label className="text-xs font-medium">Horário:</Label>
                                <span className="text-sm font-medium ml-auto">
                                    {selectedDate ? format(selectedDate, "HH:mm") : "--:--"}
                                </span>
                            </div>
                            <div className="flex h-[150px] w-full gap-2">
                                <div className="flex-1 flex flex-col gap-1 items-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Hora</span>
                                    <ScrollArea className="h-full w-full border rounded-md bg-background">
                                        <div className="flex flex-col p-1">
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <Button
                                                    key={i}
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "w-full h-8 justify-center font-normal px-1",
                                                        selectedDate && selectedDate.getHours() === i
                                                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold"
                                                            : "hover:bg-muted"
                                                    )}
                                                    onClick={() => {
                                                        const newDate = selectedDate ? new Date(selectedDate) : new Date();
                                                        newDate.setHours(i);
                                                        setSelectedDate(newDate);
                                                        setDate(newDate);
                                                    }}
                                                >
                                                    {i.toString().padStart(2, '0')}
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <div className="flex-1 flex flex-col gap-1 items-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Minuto</span>
                                    <ScrollArea className="h-full w-full border rounded-md bg-background">
                                        <div className="flex flex-col p-1">
                                            {Array.from({ length: 12 }).map((_, i) => {
                                                const min = i * 5;
                                                return (
                                                    <Button
                                                        key={min}
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "w-full h-8 justify-center font-normal px-1",
                                                            selectedDate && Math.round(selectedDate.getMinutes() / 5) * 5 === min
                                                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold"
                                                                : "hover:bg-muted"
                                                        )}
                                                        onClick={() => {
                                                            const newDate = selectedDate ? new Date(selectedDate) : new Date();
                                                            newDate.setMinutes(min);
                                                            setSelectedDate(newDate);
                                                            setDate(newDate);
                                                        }}
                                                    >
                                                        {min.toString().padStart(2, '0')}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
