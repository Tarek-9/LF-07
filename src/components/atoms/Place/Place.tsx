'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export type statusTyp = 'frei' | 'belegt' | 'reserviert';
export type sizeTyp = 'small' | 'medium' | 'large';

interface PlaceProps {
  placeName: string;
  status: statusTyp;
  size: sizeTyp;
}

const Place = ({ placeName, status, size }: PlaceProps) => {
  const setPlaceStyles = (s: statusTyp) => {
    switch (s) {
      case 'frei':
        return 'bg-[#338bd2]';
      case 'belegt':
        return 'bg-[#8a8a8a]';
      case 'reserviert':
        return 'bg-red-900';
      default:
        return '';
    }
  };

  const setSize = (sz: sizeTyp) => {
    switch (sz) {
      case 'small':
        return 'h-16';
      case 'medium':
        return 'h-26';
      case 'large':
        return 'h-36';
      default:
        return '';
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit');
  };

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant='ghost'
              className={`w-20 text-white flex hover:bg-amber-600 ${setPlaceStyles(
                status
              )} ${setSize(size)}`}
            >
              <span>{placeName}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>{size}</span>
        </TooltipContent>
      </Tooltip>

      {status === 'frei' ? (
        <DialogContent className='sm:max-w-[425px]'>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{`Platz ${placeName} buchen`}</DialogTitle>
              <DialogDescription>
                Hier kannst du den Platz {placeName} buchen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Abbrechen</Button>
              </DialogClose>
              <Button type='submit'>Buchen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogTitle>Dieser Platz kann nicht reserviert werde</DialogTitle>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default Place;
