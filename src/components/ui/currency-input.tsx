import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number | undefined
    onChange: (value: number) => void
    decimalScale?: number
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, value, onChange, decimalScale = 2, ...props }, ref) => {
        // Format the initial value
        const formatValue = (val: number | undefined) => {
            if (val === undefined || val === null) return ""
            return new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: decimalScale,
                maximumFractionDigits: decimalScale,
            }).format(val)
        }

        const [displayValue, setDisplayValue] = React.useState(formatValue(value))

        // Update display value when external value changes
        React.useEffect(() => {
            setDisplayValue(formatValue(value))
        }, [value, decimalScale])


        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value

            // Remove all non-digit characters
            const digits = inputValue.replace(/\D/g, "")

            // If empty, set to 0
            if (digits === "") {
                onChange(0)
                return
            }

            // Convert to number (divide by 10^decimalScale)
            const divisor = Math.pow(10, decimalScale)
            const numberValue = Number(digits) / divisor

            // Call parent with the number
            onChange(numberValue)
        }

        return (
            <Input
                {...props}
                ref={ref}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                className={cn("font-mono", className)}
            />
        )
    }
)
CurrencyInput.displayName = "CurrencyInput"
