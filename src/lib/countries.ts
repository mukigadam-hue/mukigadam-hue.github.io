export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  language: string; // i18n code
  phonePrefix: string;
}

export const countries: Country[] = [
  // Africa
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh', language: 'sw', phonePrefix: '+254' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', currencySymbol: 'USh', language: 'en', phonePrefix: '+256' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', currencySymbol: 'TSh', language: 'sw', phonePrefix: '+255' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', language: 'en', phonePrefix: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: 'GH₵', language: 'en', phonePrefix: '+233' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', language: 'en', phonePrefix: '+27' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB', currencySymbol: 'Br', language: 'en', phonePrefix: '+251' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', currencySymbol: 'FRw', language: 'fr', phonePrefix: '+250' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', currency: 'CDF', currencySymbol: 'FC', language: 'fr', phonePrefix: '+243' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'FCFA', language: 'fr', phonePrefix: '+237' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+221' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+225' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', currencySymbol: 'MAD', language: 'ar', phonePrefix: '+212' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', currencySymbol: 'E£', language: 'ar', phonePrefix: '+20' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW', currencySymbol: 'ZK', language: 'en', phonePrefix: '+260' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'USD', currencySymbol: '$', language: 'en', phonePrefix: '+263' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', currency: 'MWK', currencySymbol: 'MK', language: 'en', phonePrefix: '+265' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', currency: 'MZN', currencySymbol: 'MT', language: 'pt', phonePrefix: '+258' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', currency: 'AOA', currencySymbol: 'Kz', language: 'pt', phonePrefix: '+244' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+229' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+226' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', currency: 'BIF', currencySymbol: 'FBu', language: 'fr', phonePrefix: '+257' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', currency: 'SSP', currencySymbol: 'SSP', language: 'en', phonePrefix: '+211' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', currency: 'SDG', currencySymbol: 'SDG', language: 'ar', phonePrefix: '+249' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', currency: 'SOS', currencySymbol: 'Sh', language: 'en', phonePrefix: '+252' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', currency: 'MGA', currencySymbol: 'Ar', language: 'fr', phonePrefix: '+261' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+223' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+227' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', currency: 'XAF', currencySymbol: 'FCFA', language: 'fr', phonePrefix: '+235' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', currencySymbol: 'CFA', language: 'fr', phonePrefix: '+228' },
  // Americas
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', language: 'en', phonePrefix: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'CA$', language: 'en', phonePrefix: '+1' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: 'MX$', language: 'es', phonePrefix: '+52' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', language: 'pt', phonePrefix: '+55' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', currencySymbol: 'AR$', language: 'es', phonePrefix: '+54' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', currencySymbol: 'COL$', language: 'es', phonePrefix: '+57' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', currencySymbol: 'CL$', language: 'es', phonePrefix: '+56' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN', currencySymbol: 'S/', language: 'es', phonePrefix: '+51' },
  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', language: 'en', phonePrefix: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', language: 'de', phonePrefix: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', language: 'fr', phonePrefix: '+33' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', language: 'es', phonePrefix: '+34' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€', language: 'en', phonePrefix: '+39' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', currencySymbol: '€', language: 'pt', phonePrefix: '+351' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', currencySymbol: '₽', language: 'ru', phonePrefix: '+7' },
  // Asia
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', language: 'hi', phonePrefix: '+91' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', currencySymbol: '¥', language: 'zh', phonePrefix: '+86' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', language: 'ja', phonePrefix: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', currencySymbol: '₩', language: 'ko', phonePrefix: '+82' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', currencySymbol: 'SAR', language: 'ar', phonePrefix: '+966' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', currencySymbol: 'AED', language: 'ar', phonePrefix: '+971' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', currencySymbol: 'Rs', language: 'en', phonePrefix: '+92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', currencySymbol: '৳', language: 'en', phonePrefix: '+880' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', currencySymbol: 'Rp', language: 'en', phonePrefix: '+62' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', currencySymbol: '₱', language: 'en', phonePrefix: '+63' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', currencySymbol: '฿', language: 'en', phonePrefix: '+66' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', currencySymbol: '₫', language: 'en', phonePrefix: '+84' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', currencySymbol: 'RM', language: 'en', phonePrefix: '+60' },
  // Oceania
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$', language: 'en', phonePrefix: '+61' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', currencySymbol: 'NZ$', language: 'en', phonePrefix: '+64' },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag || '🌍';
}
