import AccordionGallery from "@/components/molecules/AccordionGallery/AccordionGallery";

const mockData = [
    {
        id: 1,
        title: "Was ist Next.js?",
        content:
            "Next.js ist ein React-Framework, das Server-Side Rendering und statische Seitenerstellung unterstützt. Ideal für performante Webanwendungen.",
    },
    {
        id: 2,
        title: "Wie funktioniert Tailwind CSS?",
        content:
            "Tailwind ist ein Utility-First-CSS-Framework. Du baust dein Design direkt im Markup mit vordefinierten Klassen.",
    },
    {
        id: 3,
        title: "Was ist der Unterschied zwischen Props und State?",
        content:
            "Props sind unveränderliche Eingaben, die von außen kommen. State ist veränderlich und wird innerhalb der Komponente verwaltet.",
    },
    {
        id: 4,
        title: "Wie installiere ich Storybook?",
        content:
            "Einfach mit `npx storybook@latest init`. Danach startet Storybook lokal unter `localhost:6006`.",
    },
    {
        id: 5,
        title: "Was ist ein Hook in React?",
        content:
            "Hooks sind Funktionen, die es ermöglichen, React-Features wie State und Lifecycle in funktionalen Komponenten zu nutzen.",
    },
    {
        id: 6,
        title: "Wofür ist useEffect gut?",
        content:
            "useEffect wird genutzt, um Side-Effects auszuführen – z. B. API-Calls, Event Listener oder DOM-Manipulationen.",
    },
    {
        id: 7,
        title: "Wie funktioniert das Routing in Next.js?",
        content:
            "Next.js nutzt Dateibasiertes Routing. Jede Datei im Ordner `pages` oder `app` wird automatisch zu einer Route.",
    },
    {
        id: 8,
        title: "Was ist der Unterschied zwischen SSR und SSG?",
        content:
            "SSR rendert Seiten bei jeder Anfrage auf dem Server. SSG erzeugt sie einmalig beim Build und liefert statische Dateien aus.",
    },
    {
        id: 9,
        title: "Wie funktioniert die API-Route in Next.js?",
        content:
            "In `pages/api` oder `app/api` kannst du serverseitige Endpoints erstellen, die als API fungieren.",
    },
    {
        id: 10,
        title: "Was ist ein Component-Driven Development?",
        content:
            "CDD bedeutet, dass du UIs aus kleinen, wiederverwendbaren Komponenten aufbaust und diese isoliert entwickelst – meist mit Storybook.",
    },
];


const FAQPage = () => {
    return (
        <div>
            <AccordionGallery elements={mockData}/>
        </div>
    );
}

export default FAQPage;