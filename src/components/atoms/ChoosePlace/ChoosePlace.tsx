"use client"

import * as React from "react"
import {Check, ChevronsUpDown} from "lucide-react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {PlaceElement} from "@/components/organisms/Booking/Booking"

const mockPlaces: PlaceElement[] = [
    {id: 1, name: "01", status: "frei", size: "small"},
    {id: 2, name: "02", status: "belegt", size: "medium"},
    {id: 3, name: "03", status: "reserviert", size: "large"},
    {id: 4, name: "04", status: "frei", size: "small"},
    {id: 5, name: "05", status: "belegt", size: "small"},
    {id: 6, name: "06", status: "frei", size: "small"},
    {id: 7, name: "07", status: "reserviert", size: "medium"},
    {id: 8, name: "08", status: "frei", size: "small"},
    {id: 9, name: "09", status: "belegt", size: "large"},
    {id: 10, name: "10", status: "frei", size: "medium"},
];

interface ChoosePlaceProps {
    value: number;
    onChange: (value: number) => void;
}

const ChoosePlace = ({value, onChange}: ChoosePlaceProps) => {
    const [open, setOpen] = React.useState(false);
    const selectedPlace = mockPlaces.find((place) => place.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {selectedPlace ? selectedPlace.name : "Platz auswählen..."}
                    <ChevronsUpDown className="opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Suche Plätze..." className="h-9"/>
                    <CommandList>
                        <CommandEmpty>Kein Platz gefunden</CommandEmpty>
                        <CommandGroup>
                            {mockPlaces.map((place) => (
                                <CommandItem
                                    key={place.id}
                                    value={place.name}
                                    onSelect={() => {
                                        onChange(place.id);
                                        setOpen(false);
                                    }}
                                >
                                    {place.name}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === place.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default ChoosePlace;
