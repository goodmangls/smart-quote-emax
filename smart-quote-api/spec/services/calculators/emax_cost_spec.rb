require 'rails_helper'

RSpec.describe Calculators::EmaxCost do
  it "calculates emax cost correctly" do
    result = described_class.call(billable_weight: 10, country: "CN")
    expect(result[:intl_base]).to eq(165000)
  end
end
