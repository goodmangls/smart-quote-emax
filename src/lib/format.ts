const krwFormatter = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdIntFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numKrFormatter = new Intl.NumberFormat('ko-KR');
const numKrDecFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });

export const formatKRW = (val: number): string => krwFormatter.format(val);
export const formatUSD = (val: number): string => usdFormatter.format(val);
export const formatUSDInt = (val: number): string => usdIntFormatter.format(val);
export const formatNum = (val: number): string => numKrFormatter.format(val);
export const formatNumDec = (val: number): string => numKrDecFormatter.format(val);
