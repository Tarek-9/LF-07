import Booking, {PlaceElement} from "@/components/organisms/Booking/Booking";

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

const BookingPage = () => {
    return (
        <div>
            <Booking places={mockPlaces}/>
        </div>
    );
}

export default BookingPage;