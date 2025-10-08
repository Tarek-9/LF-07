'use client';

import React from "react";
import {Button} from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type statusTyp = 'frei' | 'belegt' | 'fehler' | 'wartung'; // TODO: change to frei | belegt | reserviert
type sizeTyp = 'small' | 'medium' | 'large';

interface PlaceProps {
    placeName: string,
    status: statusTyp,
    size: sizeTyp
}

const Place = ({placeName, status, size}: PlaceProps): React.ReactElement => {
    const setPlaceStyles = (status: statusTyp): string => {
        switch (status) {
            case 'frei':
                return 'bg-green-900';
            case 'belegt':
                return 'bg-gray-500';
            case 'fehler':
                return 'bg-red-900';
            case 'wartung':
                return 'bg-purple-900';
        }
    }

    const setSize = (size: sizeTyp): string => {
        switch (size) {
            case 'small':
                return 'w-16';
            case 'medium':
                return 'w-24';
            case 'large':
                return 'w-30';
        }
    }

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log("submit");
    }

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild className='h-full p-0 hover:cursor-pointer hover:opacity-80'>
                    <Tooltip>
                        <TooltipTrigger asChild className='h-full p-0'>
                            <Button variant="ghost" className='hover:cursor-pointer'>
                                <div
                                    className={`h-16 text-white flex flex-col justify-center items-center align-middle ${setPlaceStyles(status)} ${setSize(size)}`}>
                                    <span>{placeName}</span>
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <span>{size}</span>
                        </TooltipContent>
                    </Tooltip>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{`Platz ${placeName} buchen`}</DialogTitle>
                        <DialogDescription>
                            Hier kannst du den Platz {placeName} buchen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className='hover:cursor-pointer'>abbrechen</Button>
                        </DialogClose>
                        <Button type="submit" className='hover:cursor-pointer' onClick={onSubmit}>Buchen</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>

    );
}

export default Place;