require 'json'

puts "Running Rails Integration Verification..."

input = {
  originCountry: 'KR',
  destinationCountry: 'US',
  items: [
    { length: 50, width: 40, height: 30, weight: 10, quantity: 1 }
  ],
  packingType: 'NONE',
  incoterm: 'DAP',
  domesticRegionCode: 'A',
  marginPercent: 15
}

begin
  result = QuoteCalculator.call(input)
  puts JSON.pretty_generate(result)
  puts "\n[SUCCESS] Calculation completed without errors."
rescue => e
  puts "\n[ERROR] Calculation failed: #{e.message}"
  puts e.backtrace
end
