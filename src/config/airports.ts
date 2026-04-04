export interface AirportData {
  lat: number;
  lng: number;
  city: string;
  cityKo: string;
}

/** Shared airport coordinate data used by route map components */
export const AIRPORTS: Record<string, AirportData> = {
  ICN: { lat: 37.46, lng: 126.44, city: 'Seoul/Incheon', cityKo: '인천' },
  PUS: { lat: 35.18, lng: 128.94, city: 'Busan', cityKo: '부산' },
  // North America
  LAX: { lat: 33.94, lng: -118.41, city: 'Los Angeles', cityKo: '로스앤젤레스' },
  YYC: { lat: 51.13, lng: -114.02, city: 'Calgary', cityKo: '캘거리' },
  YVR: { lat: 49.19, lng: -123.18, city: 'Vancouver', cityKo: '밴쿠버' },
  EWR: { lat: 40.69, lng: -74.17, city: 'Newark', cityKo: '뉴어크' },
  SFO: { lat: 37.62, lng: -122.38, city: 'San Francisco', cityKo: '샌프란시스코' },
  HNL: { lat: 21.32, lng: -157.92, city: 'Honolulu', cityKo: '호놀룰루' },
  MEX: { lat: 19.44, lng: -99.07, city: 'Mexico City', cityKo: '멕시코시티' },
  ORD: { lat: 41.98, lng: -87.90, city: 'Chicago', cityKo: '시카고' },
  IAD: { lat: 38.95, lng: -77.46, city: 'Washington Dulles', cityKo: '워싱턴 덜레스' },
  // Asia
  NRT: { lat: 35.76, lng: 140.39, city: 'Tokyo/Narita', cityKo: '도쿄/나리타' },
  FUK: { lat: 33.59, lng: 130.45, city: 'Fukuoka', cityKo: '후쿠오카' },
  KIX: { lat: 34.43, lng: 135.24, city: 'Osaka/Kansai', cityKo: '오사카/간사이' },
  PVG: { lat: 31.14, lng: 121.81, city: 'Shanghai', cityKo: '상하이' },
  SZX: { lat: 22.64, lng: 113.81, city: 'Shenzhen', cityKo: '선전' },
  HAN: { lat: 21.22, lng: 105.81, city: 'Hanoi', cityKo: '하노이' },
  BKK: { lat: 13.68, lng: 100.75, city: 'Bangkok', cityKo: '방콕' },
  DAD: { lat: 16.04, lng: 108.2, city: 'Da Nang', cityKo: '다낭' },
  CEB: { lat: 10.31, lng: 123.98, city: 'Cebu', cityKo: '세부' },
  HKG: { lat: 22.31, lng: 113.91, city: 'Hong Kong', cityKo: '홍콩' },
  UBN: { lat: 47.85, lng: 106.77, city: 'Ulaanbaatar', cityKo: '울란바토르' },
  TPE: { lat: 25.08, lng: 121.23, city: 'Taipei/Taoyuan', cityKo: '타이베이/타오위안' },
  CGK: { lat: -6.13, lng: 106.66, city: 'Jakarta', cityKo: '자카르타' },
  // Europe
  SVO: { lat: 55.97, lng: 37.41, city: 'Moscow', cityKo: '모스크바' },
  FRA: { lat: 50.03, lng: 8.57, city: 'Frankfurt', cityKo: '프랑크푸르트' },
  CDG: { lat: 49.01, lng: 2.55, city: 'Paris', cityKo: '파리' },
  FCO: { lat: 41.80, lng: 12.25, city: 'Rome', cityKo: '로마' },
  BCN: { lat: 41.30, lng: 2.08, city: 'Barcelona', cityKo: '바르셀로나' },
};
