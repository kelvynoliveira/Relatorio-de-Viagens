"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast glass-card border border-white/5 shadow-2xl rounded-2xl p-4 flex gap-3 items-center",
          description: "text-muted-foreground font-medium",
          actionButton: "bg-primary text-primary-foreground font-bold rounded-xl",
          cancelButton: "bg-muted text-muted-foreground font-bold rounded-xl",
          success: "text-emerald-500",
          error: "text-destructive",
          warning: "text-amber-500",
          info: "text-blue-500",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
