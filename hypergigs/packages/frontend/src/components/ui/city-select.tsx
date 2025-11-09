import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { City } from "country-state-city"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CitySelectProps {
  countryCode?: string // ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CitySelect({
  countryCode,
  value,
  onChange,
  placeholder = "Select city...",
  className,
  disabled = false,
}: CitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  // Get cities for the selected country with loading state
  const cityList = React.useMemo(() => {
    if (!countryCode) return []

    setIsLoading(true)

    // Defer to next tick to show loading state
    const cities = City.getCitiesOfCountry(countryCode) || []

    const processed = cities
      .map((city) => ({
        value: city.name,
        label: city.name,
        stateCode: city.stateCode,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // Use setTimeout to allow UI to update
    setTimeout(() => setIsLoading(false), 0)

    return processed
  }, [countryCode])

  const selectedCity = cityList.find((city) => city.value === value)

  // Filter cities based on search with limit for performance
  const filteredCities = React.useMemo(() => {
    if (!search) {
      // Show only first 100 cities initially for performance
      return cityList.slice(0, 100)
    }

    const searchLower = search.toLowerCase()
    const filtered = cityList.filter(city =>
      city.label.toLowerCase().includes(searchLower)
    )

    // Limit results to 100 for performance
    return filtered.slice(0, 100)
  }, [search, cityList])

  const handleSelect = (cityValue: string) => {
    onChange?.(cityValue === value ? "" : cityValue)
    setOpen(false)
    setSearch("")
  }

  // Show total count
  const totalCities = cityList.length
  const showingCount = filteredCities.length
  const hasMore = search ? cityList.filter(city =>
    city.label.toLowerCase().includes(search.toLowerCase())
  ).length > 100 : totalCities > 100

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (disabled) return
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
          disabled={disabled || !countryCode}
          className={cn(
            "w-full justify-between font-normal",
            !selectedCity && "text-gray-500",
            className
          )}
        >
          {selectedCity ? (
            <span className="text-gray-900">{selectedCity.label}</span>
          ) : (
            <span className="text-gray-500">
              {!countryCode ? "Select country first" : placeholder}
            </span>
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
              placeholder={`Search ${totalCities} cities...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading cities...</span>
            </div>
          ) : (
            <>
              {/* City Count Info */}
              {totalCities > 0 && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/50">
                  Showing {showingCount} of {totalCities} cities
                  {hasMore && !search && " - use search to find more"}
                </div>
              )}

              {/* City List */}
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  {filteredCities.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {cityList.length === 0
                        ? "No cities available for this country."
                        : search
                          ? `No cities found matching "${search}"`
                          : "No cities found."}
                    </div>
                  ) : (
                    <>
                      {filteredCities.map((city, index) => (
                        <button
                          key={`${city.value}-${city.stateCode}-${index}`}
                          type="button"
                          onClick={() => handleSelect(city.value)}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            value === city.value && "bg-accent"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === city.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{city.label}</span>
                          {city.stateCode && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({city.stateCode})
                            </span>
                          )}
                        </button>
                      ))}
                      {hasMore && (
                        <div className="px-2 py-2 text-xs text-center text-muted-foreground border-t mt-1">
                          {search
                            ? "Showing first 100 matches - refine search to see more"
                            : "Showing first 100 cities - use search to find specific cities"}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
