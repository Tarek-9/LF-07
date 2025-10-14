import AccordionGallery from '@/components/molecules/AccordionGallery/AccordionGallery';

const mockData = [
  {
    id: 1,
    title: 'Was ist das Smart-Spind-System?',
    content:
      'Es ist ein Cyber-Physisches System, das die Nutzung von Spinden effizienter, sicherer und transparenter macht. Es nutzt Sensoren, Anzeigen und ein Backend zur automatischen Überwachung der Belegung.',
  },
  {
    id: 2,
    title: 'Wie entsperre oder sperre ich einen Spind?',
    content:
      'Der Zugang wird über RFID- oder PIN-Erkennung gesteuert. Kunden können den Spind mit ihrer Mitgliedskarte (NFC/RFID) oder ihrem Passwort (PIN) entsperren.',
  },
  {
    id: 3,
    title: 'Wie sehe ich, ob ein Spind frei ist?',
    content:
      'LED-Anzeigen informieren in Echtzeit darüber, welche Spinde frei oder belegt sind, sodass Kunden sofort einen verfügbaren Spind finden.',
  },
  {
    id: 4,
    title: 'Welche Sensoren und Aktoren werden verwendet?',
    content:
      'Das System nutzt PIR-Motion-Sensoren, RFID-Reader und einen Membranschalter als Sensoren. Als Aktoren dienen LEDs, ein LCD und ein Servomotor.',
  },
  {
    id: 5,
    title: 'Was passiert, wenn ich einen Spind belege?',
    content:
      "Das System speichert die Nutzung automatisch, inklusive Benutzer-ID, Uhrzeit und Spind-ID. Der Spindstatus wird auf 'besetzt' aktualisiert.",
  },
  {
    id: 6,
    title: 'Wie wird die Spindbelegung protokolliert?',
    content:
      'Alle Nutzungen werden protokolliert. Dies ermöglicht dem Geschäftsführer jederzeit einen digitalen Überblick und hilft, Engpässe frühzeitig zu erkennen.',
  },
  {
    id: 7,
    title: 'Was zeigt die rote LED an?',
    content:
      "Die rote LED zeigt an, dass der Spind 'besetzt' ist. Gelb signalisiert 'reserviert' oder 'Wartung', und Grün signalisiert 'frei'.",
  },
  {
    id: 8,
    title: 'Was passiert, wenn eine Bewegung erkannt wird?',
    content:
      'Die Erkennung durch den Motion-Sensor (PIR) löst die Anzeige des aktuellen Spindstatus (Rot, Gelb, Grün) auf dem Display aus.',
  },
  {
    id: 9,
    title: 'Wie hilft das System dem Geschäftsführer?',
    content:
      'Es reduziert Wartezeiten und Unzufriedenheit der Kunden. Außerdem erhält der Geschäftsführer Kontrolle über die Belegung, wodurch Abläufe optimiert werden.',
  },
  {
    id: 10,
    title: 'Was ist der Hauptzweck des Systems?',
    content:
      'Ziel ist es, die Spindnutzung effizienter, sicherer und transparenter zu gestalten, um Frust und Verzögerungen beim Training zu vermeiden.',
  },
];

const FAQPage = () => {
  return (
    <div>
      <AccordionGallery elements={mockData} />
    </div>
  );
};

export default FAQPage;
