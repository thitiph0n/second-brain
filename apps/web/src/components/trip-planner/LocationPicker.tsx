import { useState, useEffect, useRef } from "react";
import { MapPin, X, Plus } from "lucide-react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Location } from "./types";

interface LocationPickerProps {
	value?: Location;
	onChange: (location: Location | undefined) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function LocationPicker({
	value,
	onChange,
	onClear,
	placeholder = "Search for a location...",
	disabled,
	className,
}: LocationPickerProps) {
	const [isExpanded, setIsExpanded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Google Places Autocomplete Hook
    const {
        value: searchValue,
        suggestions: { status, data },
        setValue: setSearchValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
        // If Google Maps script is not loaded, this hook handles it gracefully mostly,
        // but we should ideally check for script presence or API key.
        // For now, we rely on the ready state.
    });

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				clearSuggestions();
                setIsExpanded(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [clearSuggestions]);
    
    // Sync local search value with prop value if needed, 
    // but usually we want the search input to be independent until selected.
    // implementation_detail: We don't sync back from value to searchValue to avoid fetching again on edit.

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
		setIsExpanded(true);
	};

	const handleSuggestionSelect = async (suggestion: google.maps.places.AutocompletePrediction) => {
        setSearchValue(suggestion.description, false);
        clearSuggestions();
        setIsExpanded(false);

        try {
            const results = await getGeocode({ address: suggestion.description });
            const { lat, lng } = await getLatLng(results[0]);
            
            // Extract meaningful components
            const addressComponents = results[0].address_components;
            let city = "";
            let country = "";
            
            addressComponents.forEach(component => {
                if (component.types.includes("locality")) {
                    city = component.long_name;
                }
                if (component.types.includes("country")) {
                    country = component.long_name;
                }
            });

            // Fallbacks if city is missing (e.g. for landmarks)
            if (!city) {
                city = suggestion.structured_formatting.main_text;
            }

            const location: Location = {
                address: results[0].formatted_address,
                city,
                country,
                coordinates: {
                    latitude: lat,
                    longitude: lng,
                },
                placeId: suggestion.place_id,
            };

            onChange(location);
        } catch (error) {
            console.error("Error: ", error);
            // Fallback to manual entry data if geocoding fails
             const location: Location = {
                address: suggestion.description,
                city: suggestion.structured_formatting.main_text,
                placeId: suggestion.place_id,
            };
            onChange(location);
        }
	};

	const handleClear = () => {
		onChange(undefined);
		onClear?.();
		setSearchValue("");
		clearSuggestions();
	};

	const handleAddManualLocation = () => {
		const location: Location = {
			address: searchValue,
			city: searchValue,
		};
		onChange(location);
		// setSearchValue(""); // Keep the value or clear it? Keeping it clears context usually.
        // Let's clear search but keep selection displayed via `value` prop
        setSearchValue("");
		clearSuggestions();
		setIsExpanded(false);
	};

	return (
		<div className={cn("relative", className)}>
			{/* Input */}
			<div className="relative">
				<MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={placeholder}
					value={searchValue}
					onChange={handleSearchChange}
					onFocus={() => setIsExpanded(true)}
					disabled={disabled}
					className="pl-10 pr-10"
				/>
				{value && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			 {/* Suggestions Dropdown */}
			{isExpanded && status === "OK" && (
				<Card
					ref={dropdownRef}
					className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-60 overflow-auto"
				>
					<CardContent className="p-0">
                        <div className="p-1">
                            {data.map((suggestion) => (
                                <button
                                    key={suggestion.place_id}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {suggestion.structured_formatting.main_text}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {suggestion.structured_formatting.secondary_text}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
					</CardContent>
				</Card>
			)}
            
            {/* Empty State / Manual Add */}
            {isExpanded && searchValue && status !== "OK" && (
                 <Card
					ref={dropdownRef}
					className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-60 overflow-auto"
				>
					<CardContent className="p-4 space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">
                            {status === "ZERO_RESULTS" ? "No locations found." : "Enter a location"}
                        </p>
                        <Button
                            onClick={handleAddManualLocation}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Use "{searchValue}" manually
                        </Button>
                    </CardContent>
                </Card>
            )}

			 {/* Selected Location Display */}
			{value && !searchValue && (
				<div className="mt-2 p-3 border rounded-lg bg-accent/30">
					<div className="flex items-start gap-3">
						<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
						<div className="flex-1 min-w-0">
							<p className="font-medium">{value.city}</p>
							{value.address && (
								<p className="text-sm text-muted-foreground truncate">
									{value.address}
								</p>
							)}
							{value.country && (
								<p className="text-xs text-muted-foreground">
									{value.country}
								</p>
							)}
						</div>
						<Badge variant="outline" className="text-xs">
							Selected
						</Badge>
					</div>
				</div>
			)}
		</div>
	);
}

// Simple location input component for manual entry
interface LocationInputProps {
	value?: Location;
	onChange: (location: Location | undefined) => void;
	disabled?: boolean;
	className?: string;
}

export function LocationInput({ value, onChange, disabled, className }: LocationInputProps) {
	const [tempAddress, setTempAddress] = useState(value?.address || "");
	const [tempCity, setTempCity] = useState(value?.city || "");

	const handleUpdate = () => {
		if (tempAddress || tempCity) {
			onChange({
				address: tempAddress || undefined,
				city: tempCity || undefined,
				country: value?.country,
				coordinates: value?.coordinates,
			});
		} else {
			onChange(undefined);
		}
	};

	return (
		<div className={cn("space-y-2", className)}>
			<div className="space-y-2">
				<Input
					placeholder="Address"
					value={tempAddress}
					onChange={(e) => setTempAddress(e.target.value)}
					disabled={disabled}
					onBlur={handleUpdate}
				/>
				<Input
					placeholder="City"
					value={tempCity}
					onChange={(e) => setTempCity(e.target.value)}
					disabled={disabled}
					onBlur={handleUpdate}
				/>
			</div>
		</div>
	);
}