import Place from "@/components/atoms/Place/Place";

interface BookingProps {
    places: Array<string>
}

const Booking = ({places}: BookingProps) => {

    return (
        <div className='grid grid-flow-col'>
            <Place placeName='01' status='frei' size='small'/>
            <Place placeName='02' status='belegt' size='medium'/>
            <Place placeName='03' status='fehler' size='large'/>
            <Place placeName='04' status='wartung' size='small'/>
            <Place placeName='05' status='belegt' size='small'/>
            <Place placeName='06' status='frei' size='small'/>
            <Place placeName='07' status='belegt' size='small'/>
            <Place placeName='08' status='frei' size='small'/>
        </div>
    );
}

export default Booking;