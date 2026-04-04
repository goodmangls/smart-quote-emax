
import { calculateUpsCosts } from '../src/features/quote/services/calculationService';

// Mock DetermineUpsZone to double check our expectations? 
// No, let's test the real function inclusive of zone determination.

const testCases = [
  // C3 (China)
  { weight: 0.5, country: 'CN', expectedBase: 31950, desc: '0.5kg China (Exact Min)' },
  { weight: 2.0, country: 'CN', expectedBase: 39250, desc: '2.0kg China' },
  { weight: 20.0, country: 'CN', expectedBase: 88575, desc: '20.0kg China (Max Exact)' },
  { weight: 21.0, country: 'CN', expectedBase: 21 * 4300, desc: '21.0kg China (Min Range)' }, // 90300
  { weight: 300.0, country: 'CN', expectedBase: 300 * 4300, desc: '300kg China (Freight)' },

  // C4 (Japan)
  { weight: 0.5, country: 'JP', expectedBase: 32325, desc: '0.5kg Japan' },
  
  // C7 (USA)
  { weight: 0.5, country: 'US', expectedBase: 37950, desc: '0.5kg USA' },
  { weight: 100.0, country: 'US', expectedBase: 100 * 8700, desc: '100kg USA (Freight)' },
];

console.log("Running UPS Rate Verification...");

let failed = 0;

testCases.forEach(tc => {
    // fscPercent = 0 to test base rate only
    const result = calculateUpsCosts(tc.weight, tc.country, 0);
    
    // Allow slight floating point diff?
    const diff = Math.abs(result.upsBase - tc.expectedBase);
    
    if (diff > 1) {
        console.error(`[FAIL] ${tc.desc}: Expected ${tc.expectedBase}, Got ${result.upsBase}`);
        failed++;
    } else {
        console.log(`[PASS] ${tc.desc}: ${result.upsBase} (${result.appliedZone})`);
    }
});

if (failed > 0) {
    console.error(`\nverification FAILED with ${failed} errors.`);
    process.exit(1);
} else {
    console.log("\nAll tests passed!");
}
