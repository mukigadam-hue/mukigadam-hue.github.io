import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useBusiness } from '@/context/BusinessContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageSelector from '@/components/LanguageSelector';

export default function PersonalPreferencesSettings() {
  const { t } = useTranslation();
  const { currentBusiness, updateBusiness, userRole } = useBusiness();
  const { currency, setCurrency } = useCurrency();
  const [currencyInput, setCurrencyInput] = useState(currency);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    setCurrencyInput(currency);
  }, [currency, currentBusiness?.id]);

  async function handleSaveCurrency() {
    const sym = currencyInput.trim() || 'KSh';

    setCurrency(sym, {
      businessId: currentBusiness?.id,
      persistAsOverride: !isOwnerOrAdmin,
    });

    if (isOwnerOrAdmin && currentBusiness) {
      await updateBusiness({ currency_symbol: sym } as any);
      toast.success(`Currency set to: ${sym}`);
      return;
    }

    toast.success(`Your currency set to: ${sym}`);
  }

  return (
    <>
      <Card className="shadow-card">
        <CardContent className="p-4">
          <LanguageSelector variant="full" />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-base font-semibold">{t('settings.currencySymbol')}</h2>
          <p className="text-xs text-muted-foreground">Applies only to your side of the app on this device.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>{t('settings.currencySymbol')}</Label>
              <Input value={currencyInput} onChange={e => setCurrencyInput(e.target.value)} placeholder="KSh" maxLength={6} />
            </div>
            <Button onClick={handleSaveCurrency}>
              <Save className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('settings.preview')}: <span className="font-semibold text-success">{currencyInput || 'KSh'} 1,000.00</span>
          </p>
        </CardContent>
      </Card>
    </>
  );
}