import Booking, {PlaceElement} from "@/components/organisms/Booking/Booking";

const mockPlaces: PlaceElement[] = [
    {id: 1, name: "01", status: "frei", size: "small"},
    {id: 2, name: "02", status: "belegt", size: "small"},
    {id: 3, name: "03", status: "reserviert", size: "small"},
    {id: 4, name: "04", status: "frei", size: "small"},
    {id: 5, name: "05", status: "belegt", size: "small"},
    {id: 6, name: "06", status: "frei", size: "small"},
    {id: 7, name: "07", status: "reserviert", size: "small"},
    {id: 8, name: "08", status: "frei", size: "small"},
    {id: 9, name: "09", status: "belegt", size: "small"},
    {id: 10, name: "10", status: "frei", size: "small"},
    {id: 11, name: "11", status: "belegt", size: "small"},
    {id: 12, name: "12", status: "frei", size: "small"},
    {id: 13, name: "13", status: "reserviert", size: "small"},
    {id: 14, name: "14", status: "frei", size: "small"},
    {id: 15, name: "15", status: "belegt", size: "small"},
    {id: 16, name: "16", status: "frei", size: "small"},
    {id: 17, name: "17", status: "reserviert", size: "small"},
    {id: 18, name: "18", status: "belegt", size: "small"},
    {id: 19, name: "19", status: "frei", size: "small"},
    {id: 20, name: "20", status: "belegt", size: "small"},
    {id: 21, name: "21", status: "frei", size: "small"},
    {id: 22, name: "22", status: "reserviert", size: "small"},
    {id: 23, name: "23", status: "belegt", size: "small"},
    {id: 24, name: "24", status: "frei", size: "small"},
    {id: 25, name: "25", status: "belegt", size: "small"},
    {id: 26, name: "26", status: "reserviert", size: "small"},
    {id: 27, name: "27", status: "frei", size: "small"},
    {id: 28, name: "28", status: "belegt", size: "small"},
    {id: 29, name: "29", status: "frei", size: "small"},
    {id: 30, name: "30", status: "reserviert", size: "small"},
];

const BookingPage = () => {
    return (
        <div>
            <Booking places={mockPlaces}/>
        </div>
    );
}

export default BookingPage;