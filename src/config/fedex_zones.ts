export const determineFedexZone = (country: string): { rateKey: string; label: string } => {
  // Zone V: Hong Kong
  if (['HK'].includes(country)) return { rateKey: 'ZV', label: 'Hong Kong' };

  // Zone A: Macau
  if (['MO'].includes(country)) return { rateKey: 'ZA', label: 'Macau' };

  // Zone W: China
  if (['CN'].includes(country)) return { rateKey: 'ZW', label: 'China' };

  // Zone X: Taiwan
  if (['TW'].includes(country)) return { rateKey: 'ZX', label: 'Taiwan' };

  // Zone Y: Singapore
  if (['SG'].includes(country)) return { rateKey: 'ZY', label: 'Singapore' };

  // Zone P: Japan
  if (['JP'].includes(country)) return { rateKey: 'ZP', label: 'Japan' };

  // Zone Q: Malaysia
  if (['MY'].includes(country)) return { rateKey: 'ZQ', label: 'Malaysia' };

  // Zone R: Thailand
  if (['TH'].includes(country)) return { rateKey: 'ZR', label: 'Thailand' };

  // Zone S: Philippines
  if (['PH'].includes(country)) return { rateKey: 'ZS', label: 'Philippines' };

  // Zone T: Indonesia
  if (['ID'].includes(country)) return { rateKey: 'ZT', label: 'Indonesia' };

  // Zone N: Vietnam
  if (['VN'].includes(country)) return { rateKey: 'ZN', label: 'Vietnam' };

  // Zone O: India
  if (['IN'].includes(country)) return { rateKey: 'ZO', label: 'India' };

  // Zone U: Australia
  if (['AU'].includes(country)) return { rateKey: 'ZU', label: 'Australia' };

  // Zone D: Guam, Saipan, Laos, Mongolia, Brunei
  if (['GU', 'MP', 'LA', 'MN', 'BN'].includes(country)) return { rateKey: 'ZD', label: 'GU/MP/LA/MN/BN' };

  // Zone F: USA, Canada, New Zealand, Mexico
  if (['US', 'CA', 'NZ', 'MX'].includes(country)) return { rateKey: 'ZF', label: 'US/CA/NZ/MX' };

  // Zone M: Italy, Spain, UK, Germany, France, etc. (Western Europe)
  const westernEurope = ['IT', 'ES', 'GB', 'DE', 'FR', 'CH', 'FI', 'SE', 'NO', 'PT', 'IE', 'MC'];
  if (westernEurope.includes(country)) return { rateKey: 'ZM', label: 'Western Europe' };

  // Zone G: Austria, Denmark, Hungary, Belgium, Czech, Greece, Netherlands, Poland, Israel
  const europeII = ['AT', 'DK', 'HU', 'BE', 'CZ', 'GR', 'NL', 'PL', 'IL'];
  if (europeII.includes(country)) return { rateKey: 'ZG', label: 'Europe II' };

  // Zone H: Eastern Europe, Russia, Romania, Turkey
  const easternEurope = ['RU', 'RO', 'TR', 'BG', 'EE', 'LV', 'LT', 'SK', 'SI', 'UA', 'BY'];
  if (easternEurope.includes(country)) return { rateKey: 'ZH', label: 'Eastern Europe' };

  // Zone I: South America
  const southAmerica = ['AR', 'BR', 'CL', 'PY', 'PE', 'UY', 'CO', 'VE', 'EC', 'BO'];
  if (southAmerica.includes(country)) return { rateKey: 'ZI', label: 'South America' };

  // Zone J: Middle East & Africa (Default catch-all)
  const middleEast = ['AE', 'SA', 'BH', 'QA', 'JO', 'LB', 'EG', 'ZA', 'PK'];
  if (middleEast.includes(country)) return { rateKey: 'ZJ', label: 'Middle East' };

  // Default catch-all
  return { rateKey: 'ZJ', label: 'Rest of World' };
};
