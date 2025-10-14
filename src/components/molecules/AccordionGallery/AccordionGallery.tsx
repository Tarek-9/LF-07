import AccordionDefault from '@/components/atoms/AccordionElement/AccordionElement';
import { Accordion } from '@/components/ui/accordion';

interface AccordionElement {
  id: string | number;
  title: string;
  content: string;
}

interface AccordionGalleryProps {
  elements: AccordionElement[];
}

const AccordionGallery = ({ elements }: AccordionGalleryProps) => {
  return (
    <Accordion
      type='single'
      collapsible
      className='w-full'
      defaultValue='item-1'
    >
      {elements.map((element) => (
        <AccordionDefault
          key={element.id}
          title={element.title}
          content={element.content}
          value={`item-${element.id}`}
        />
      ))}
    </Accordion>
  );
};

export default AccordionGallery;
