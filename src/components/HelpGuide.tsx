import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TOPICS = [
  { key: 'gettingStarted', icon: '🚀' },
  { key: 'settings', icon: '⚙️' },
  { key: 'discover', icon: '🌍' },
  { key: 'addingItems', icon: '📦' },
  { key: 'team', icon: '👥' },
  { key: 'receipts', icon: '🧾' },
  { key: 'orders', icon: '📋' },
  { key: 'wasteExpenses', icon: '🗑️' },
  { key: 'multiBusiness', icon: '🔄' },
  { key: 'tips', icon: '💡' },
];

export default function HelpGuide() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
      >
        <HelpCircle className="h-4 w-4" />
        {t('help.button')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              {t('help.title')}
            </DialogTitle>
            <DialogDescription>{t('help.intro')}</DialogDescription>
          </DialogHeader>

          <Accordion type="single" collapsible className="w-full">
            {TOPICS.map(({ key, icon }) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-left text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <span>{icon}</span>
                    {t(`help.topics.${key}.title`)}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {t(`help.topics.${key}.body`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DialogContent>
      </Dialog>
    </>
  );
}
