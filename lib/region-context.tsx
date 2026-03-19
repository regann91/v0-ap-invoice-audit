"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type RegionCode = "SG" | "TH" | "VN" | "MY" | "PH" | "TW" | "ID" | "BR" | "CN" | "HK"

export interface RegionOption {
  code: RegionCode
  name: string
}

export const REGIONS: RegionOption[] = [
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "TW", name: "Taiwan" },
  { code: "ID", name: "Indonesia" },
  { code: "BR", name: "Brazil" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
]

interface RegionContextValue {
  region: RegionCode
  setRegion: (r: RegionCode) => void
}

const RegionContext = createContext<RegionContextValue>({
  region: "SG",
  setRegion: () => {},
})

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<RegionCode>("SG")
  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  return useContext(RegionContext)
}
