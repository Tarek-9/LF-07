'use client';

import React, {useState} from "react";

type statusTyp = 'frei' | 'belegt' | 'fehler' | 'wartung';

interface PlaceProps {
    placeName: string,
    value: statusTyp,
}

const Place = ({placeName, value}: PlaceProps) => {
    const [status, setStatus] = useState(value);

    const getPlaceStyles = (status: statusTyp): string => {
        switch (status) {
            case 'frei':
                return 'bg-green-900';
            case 'belegt':
                return 'bg-grey-900';
            case 'fehler':
                return 'bg-yellow-900';
            case 'wartung':
                return 'bg-purple-900';
        }
    }

    return (
        <div className={`h-8 w-8 text-white ${getPlaceStyles(status)}`}>
            <span>{placeName}</span>
        </div>
    );
}

export default Place;