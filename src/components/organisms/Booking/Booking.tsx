import React from 'react';
import Place, { sizeTyp, statusTyp } from '@/components/atoms/Place/Place';

export interface PlaceElement {
  id: number;
  name: string;
  status: statusTyp;
  size: sizeTyp;
}

interface BookingProps {
  places: PlaceElement[];
}

const Booking = ({ places }: BookingProps): React.ReactElement => {
  return (
    <div>
      <div className='mb-6'>
        <h2 className='font-bold'>Legende:</h2>
        <ul className='flex flex-column gap-6'>
          <li className='flex flex-column gap-1 items-center'>
            <div className='h-5 w-5 bg-[#338bd2] rounded-sm'></div>
            <span>Frei</span>
          </li>
          <li className='flex flex-column gap-1 items-center'>
            <div className='h-5 w-5 bg-[#8a8a8a] rounded-sm'></div>
            <span>Belegt</span>
          </li>
          <li className='flex flex-column gap-1 items-center'>
            <div className='h-5 w-5 bg-red-900 rounded-sm'></div>
            <span>Reserviert</span>
          </li>
        </ul>
      </div>
      <div className='grid grid-cols-10 gap-8 items-center'>
        {places.map((place) => (
          <Place
            key={place.id}
            placeName={place.name}
            status={place.status}
            size={place.size}
          />
        ))}
      </div>
    </div>
  );
};

export default Booking;
