require "rails_helper"

# Where the fuel surcharge comes from when the request does not carry one.
#
# The admin FSC widget writes to fsc_rates, but the calculator read only the
# constants in rates.rb — FscFetcher was wired to the controller and nothing
# else. A rate raised in the widget therefore never reached a quote. The
# constants stay as the fallback for when the DB read fails.
RSpec.describe QuoteCalculator, "FSC source" do
  def base_input(overrides = {})
    {
      overseasCarrier: "UPS",
      destinationCountry: "US",
      incoterm: "DAP",
      packingType: "NONE",
      discountPercent: 0,
      dutyTaxEstimate: 0,
      exchangeRate: 1300,
      items: [ { length: 30, width: 30, height: 30, weight: 10, quantity: 1 } ]
    }.merge(overrides)
  end

  # Deliberately unlike any shipped constant, so the assertion still
  # discriminates after the next weekly rate update lands in rates.rb.
  let(:db_ups) { 50.5 }
  let(:db_dhl) { 51.5 }
  let(:db_fedex) { 52.5 }
  let(:db_ocs) { 53.5 }

  def stub_db_rates
    allow(FscFetcher).to receive(:current_rates).and_return(
      "UPS" => { "international" => db_ups, "domestic" => db_ups },
      "DHL" => { "international" => db_dhl, "domestic" => db_dhl },
      "FEDEX" => { "international" => db_fedex, "domestic" => db_fedex },
      "OCS" => { "international" => db_ocs, "domestic" => db_ocs }
    )
  end

  # intlFsc is charged on the base rate, so the applied percentage is
  # recoverable from the breakdown without restating the tariff.
  def applied_fsc_percent(result)
    (result[:breakdown][:intlFsc] / result[:breakdown][:intlBase].to_f * 100).round(2)
  end

  context "when the request omits fscPercent" do
    before { stub_db_rates }

    it "charges the DB rate for UPS" do
      result = described_class.call(base_input)

      expect(applied_fsc_percent(result)).to be_within(0.05).of(db_ups)
    end

    it "charges the DB rate for DHL" do
      result = described_class.call(base_input(overseasCarrier: "DHL"))

      expect(applied_fsc_percent(result)).to be_within(0.05).of(db_dhl)
    end

    it "charges the DB rate for FedEx" do
      result = described_class.call(base_input(overseasCarrier: "FEDEX"))

      expect(applied_fsc_percent(result)).to be_within(0.05).of(db_fedex)
    end

    # The calculator receives "FDX" from some call sites; the DB keys on FEDEX.
    it "maps the FDX alias onto the FEDEX row" do
      result = described_class.call(base_input(overseasCarrier: "FDX"))

      expect(applied_fsc_percent(result)).to be_within(0.05).of(db_fedex)
    end

    it "reads the DB once per calculation rather than per lookup" do
      expect(FscFetcher).to receive(:current_rates).once.and_call_original

      described_class.call(base_input)
    end
  end

  context "when the DB read fails" do
    before do
      allow(FscFetcher).to receive(:current_rates).and_return(FscFetcher::DEFAULT_RATES)
    end

    it "falls back to the shipped constant rather than quoting without fuel" do
      result = described_class.call(base_input)

      expect(applied_fsc_percent(result))
        .to be_within(0.05).of(Constants::Rates::DEFAULT_FSC_PERCENT)
    end
  end

  context "when the request supplies fscPercent" do
    before { stub_db_rates }

    it "uses the supplied rate over the DB" do
      result = described_class.call(base_input(fscPercent: 10))

      expect(applied_fsc_percent(result)).to be_within(0.05).of(10)
    end

    it "honours an explicit 0 rather than falling back" do
      result = described_class.call(base_input(fscPercent: 0))

      expect(result[:breakdown][:intlFsc]).to eq(0)
    end
  end

  # EMAX charges fuel per kg (Constants::EmaxTariff::EMAX_FSC_PER_KG), on its own
  # branch above the percentage path — so moving the percentage source to the DB
  # must leave it untouched even if an EMAX row appears in fsc_rates.
  it "leaves the EMAX per-kg fuel surcharge untouched by the DB" do
    emax_input = base_input(overseasCarrier: "EMAX", destinationCountry: "JP")

    allow(FscFetcher).to receive(:current_rates).and_return(FscFetcher::DEFAULT_RATES)
    without_row = described_class.call(emax_input)[:breakdown][:intlFsc]

    allow(FscFetcher).to receive(:current_rates).and_return(
      FscFetcher::DEFAULT_RATES.merge("EMAX" => { "international" => 99.0, "domestic" => 99.0 })
    )
    with_row = described_class.call(emax_input)[:breakdown][:intlFsc]

    expect(with_row).to eq(without_row)
    expect(with_row).to be > 0 # per-kg charge really is applied
  end
end
