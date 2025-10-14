import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AccordionProps {
  title: string;
  content: string;
  value: string;
}

const AccordionElement = ({ title, content, value }: AccordionProps) => {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent className='flex flex-col gap-4 text-balance'>
        <p>{content}</p>
      </AccordionContent>
    </AccordionItem>
  );
};

export default AccordionElement;
