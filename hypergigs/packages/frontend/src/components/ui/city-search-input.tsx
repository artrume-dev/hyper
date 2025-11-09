import * as React from "react"
import { Check, MapPin, X } from "lucide-react"
import { City } from "country-state-city"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CitySearchInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

// Get popular cities across all countries
const getPopularCities = () => {
  const popularCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'CN', 'JP', 'BR'];
  const cities: Array<{ name: string; country: string }> = [];

  popularCountries.forEach(countryCode => {
    const countryCities = City.getCitiesOfCountry(countryCode) || [];
    // Add major cities from each country
    countryCities.slice(0, 10).forEach(city => {
      cities.push({
        name: city.name,
        country: city.countryCode
      });
    });
  });

  return cities;
};

export function CitySearchInput({
  value = '',
  onChange,
  placeholder = "Enter city name...",
  className,
}: CitySearchInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Update local state when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Get suggestions based on input
  const suggestions = React.useMemo(() => {
    if (!inputValue || inputValue.length < 2) {
      return getPopularCities().slice(0, 20);
    }

    const searchLower = inputValue.toLowerCase();
    const allCities = getPopularCities();

    return allCities
      .filter(city => city.name.toLowerCase().includes(searchLower))
      .slice(0, 20);
  }, [inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    if (newValue.length >= 2) {
      setOpen(true);
    }
  }

  const handleSelect = (cityName: string) => {
    setInputValue(cityName);
    onChange?.(cityName);
    setOpen(false);
  }

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    inputRef.current?.focus();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <PopoverTrigger asChild>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={cn(
              "w-full pl-12 pr-10 py-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base",
              className
            )}
          />
        </PopoverTrigger>
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {suggestions.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {suggestions.map((city, index) => (
                <button
                  key={`${city.name}-${city.country}-${index}`}
                  type="button"
                  onClick={() => handleSelect(city.name)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    inputValue === city.name && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      inputValue === city.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{city.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {city.country}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search cities
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
