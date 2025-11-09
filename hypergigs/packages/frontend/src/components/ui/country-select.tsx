import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import countries from "world-countries"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

const countryList = countries.map((country) => ({
  value: country.cca2,
  label: country.name.common,
  flag: country.flag,
})).sort((a, b) => a.label.localeCompare(b.label))

interface CountrySelectProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select country...",
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedCountry = countryList.find((country) => country.value === value)

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!search) return countryList
    const searchLower = search.toLowerCase()
    return countryList.filter(country =>
      country.label.toLowerCase().includes(searchLower)
    )
  }, [search])

  const handleSelect = (countryValue: string) => {
    onChange?.(countryValue === value ? "" : countryValue)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selectedCountry && "text-gray-500",
            className
          )}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span className="text-gray-900">{selectedCountry.label}</span>
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Country List */}
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No country found.
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.value}
                    type="button"
                    onClick={() => handleSelect(country.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      value === country.value && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === country.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span>{country.label}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
