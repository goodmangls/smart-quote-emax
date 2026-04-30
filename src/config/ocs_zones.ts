/**
 * OCS zone mapping: country code -> { rateKey, label }
 * Source: smart-quote-api/storage/tariffs/OCS 정가.pdf
 * Coverage: 5 countries only (Z1=TW/HK/SG, Z2=CN, Z3=JP)
 * Outside list → Z1 fallback (EMAX-style coverage warning surfaced in orchestrator)
 */

import type { ZoneInfo } from '@/config/ups_zones';

const z = (rateKey: string, label: string): ZoneInfo => ({ rateKey, label });

export const OCS_ZONE_MAP: Record<string, ZoneInfo> = {
  // Z1: Taiwan, Hong Kong, Singapore
  TW: z('Z1', 'Z1/TW-HK-SG'),
  HK: z('Z1', 'Z1/TW-HK-SG'),
  SG: z('Z1', 'Z1/TW-HK-SG'),
  // Z2: China
  CN: z('Z2', 'Z2/CN'),
  // Z3: Japan
  JP: z('Z3', 'Z3/JP'),
};

const OCS_DEFAULT_ZONE: ZoneInfo = { rateKey: 'Z1', label: 'OCS (unsupported, Z1 fallback)' };

export const determineOcsZone = (country: string): ZoneInfo =>
  OCS_ZONE_MAP[country] || OCS_DEFAULT_ZONE;
