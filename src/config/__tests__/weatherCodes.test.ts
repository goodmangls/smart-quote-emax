import { mapWeatherCode } from '../weatherCodes';

describe('mapWeatherCode', () => {
  it('maps code 0 to Clear/Normal', () => {
    const result = mapWeatherCode(0);
    expect(result).toEqual({ condition: 'Clear', icon: 'Sun', status: 'Normal' });
  });

  it('maps codes 1-3 to Cloudy/Normal', () => {
    expect(mapWeatherCode(1).condition).toBe('Cloudy');
    expect(mapWeatherCode(2).status).toBe('Normal');
    expect(mapWeatherCode(3).icon).toBe('Cloud');
  });

  it('maps codes 45-48 to Fog/Delay', () => {
    expect(mapWeatherCode(45)).toEqual({ condition: 'Fog', icon: 'CloudFog', status: 'Delay' });
    expect(mapWeatherCode(48).status).toBe('Delay');
  });

  it('maps codes 61-67 to Rain/Delay', () => {
    expect(mapWeatherCode(61).condition).toBe('Rain');
    expect(mapWeatherCode(65).status).toBe('Delay');
  });

  it('maps codes 95-99 to Storm/Warning', () => {
    expect(mapWeatherCode(95)).toEqual({ condition: 'Storm', icon: 'CloudLightning', status: 'Warning' });
    expect(mapWeatherCode(99).status).toBe('Warning');
  });

  it('maps unknown code 999 to Unknown/Normal (defensive)', () => {
    const result = mapWeatherCode(999);
    expect(result.condition).toBe('Unknown');
    expect(result.status).toBe('Normal');
  });

  it('maps codes 51-57 to Drizzle/Normal', () => {
    expect(mapWeatherCode(51).condition).toBe('Drizzle');
    expect(mapWeatherCode(53).status).toBe('Normal');
  });

  it('maps codes 71-77 to Snow/Delay', () => {
    expect(mapWeatherCode(71).condition).toBe('Snow');
    expect(mapWeatherCode(75).status).toBe('Delay');
  });
});
