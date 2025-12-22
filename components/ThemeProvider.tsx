"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Using the correct type for next-themes props
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}