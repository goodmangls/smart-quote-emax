require "rails_helper"

RSpec.describe Quote, type: :model do
  describe "validations" do
    subject { build(:quote) }

    # reference_no presence cannot be tested with shoulda because the
    # before_validation callback auto-generates it when blank.
    it { is_expected.to validate_uniqueness_of(:reference_no) }
    it { is_expected.to validate_presence_of(:destination_country) }
    it { is_expected.to validate_length_of(:destination_country).is_at_most(3) }
    it { is_expected.to validate_presence_of(:incoterm) }
    it { is_expected.to validate_inclusion_of(:incoterm).in_array(Quote::VALID_INCOTERMS) }
    it { is_expected.to validate_presence_of(:packing_type) }
    it { is_expected.to validate_inclusion_of(:packing_type).in_array(Quote::VALID_PACKING_TYPES) }
    it { is_expected.to validate_presence_of(:discount_percent) }

    it {
      is_expected.to validate_numericality_of(:discount_percent)
        .is_greater_than_or_equal_to(0)
    }

    it { is_expected.to validate_inclusion_of(:status).in_array(Quote::VALID_STATUSES) }
    it { is_expected.to validate_presence_of(:total_quote_amount) }
    it { is_expected.to validate_presence_of(:total_cost_amount) }
    it { is_expected.to validate_presence_of(:items) }
    it { is_expected.to validate_presence_of(:breakdown) }
  end

  describe "callback: generate_reference_no" do
    it "generates reference_no in SQ-YYYY-NNNN format on create" do
      quote = build(:quote, reference_no: nil)
      quote.save!

      expect(quote.reference_no).to match(/\ASQ-\d{4}-\d{4}\z/)
    end

    it "includes the current year" do
      quote = create(:quote, reference_no: nil)

      expect(quote.reference_no).to start_with("SQ-#{Time.current.year}-")
    end

    it "increments the sequence number" do
      first = create(:quote, reference_no: nil)
      second = create(:quote, reference_no: nil)

      first_seq = first.reference_no.split("-").last.to_i
      second_seq = second.reference_no.split("-").last.to_i

      expect(second_seq).to eq(first_seq + 1)
    end

    it "does not overwrite an existing reference_no" do
      quote = create(:quote, reference_no: "SQ-2025-9999")

      expect(quote.reference_no).to eq("SQ-2025-9999")
    end
  end

  describe "scopes" do
    describe ".recent" do
      it "orders by created_at descending" do
        old_quote = create(:quote)
        new_quote = create(:quote)

        result = Quote.recent.to_a

        expect(result).to eq([new_quote, old_quote])
      end
    end

    describe ".by_destination" do
      it "filters by destination_country" do
        us_quote = create(:quote, destination_country: "US")
        create(:quote, destination_country: "JP")

        expect(Quote.by_destination("US").to_a).to eq([us_quote])
      end

      it "returns all when country is blank" do
        create(:quote, destination_country: "US")
        create(:quote, destination_country: "JP")

        expect(Quote.by_destination(nil).count).to eq(2)
      end
    end

    describe ".by_status" do
      it "filters by status" do
        draft = create(:quote, status: "draft")
        create(:quote, :sent)

        expect(Quote.by_status("draft").to_a).to eq([draft])
      end

      it "returns all when status is blank" do
        create(:quote)
        create(:quote, :sent)

        expect(Quote.by_status(nil).count).to eq(2)
      end
    end

    describe ".by_date_range" do
      it "filters quotes within date range" do
        old = create(:quote, created_at: 10.days.ago)
        recent = create(:quote, created_at: 1.day.ago)

        results = Quote.by_date_range(5.days.ago.to_s, Date.current.to_s)

        expect(results).to include(recent)
        expect(results).not_to include(old)
      end

      it "returns all when both dates are nil" do
        create(:quote)

        expect(Quote.by_date_range(nil, nil).count).to eq(1)
      end
    end

    describe ".search_text" do
      it "searches by reference_no" do
        quote = create(:quote, reference_no: "SQ-2026-0099")
        create(:quote, reference_no: "SQ-2026-0100")

        expect(Quote.search_text("0099").to_a).to eq([quote])
      end

      it "searches by destination_country" do
        us_quote = create(:quote, destination_country: "US")
        create(:quote, destination_country: "JP")

        result = Quote.search_text("US").to_a
        expect(result).to include(us_quote)
        result.each { |q| expect(q.destination_country).to eq("US") }
      end

      it "returns all when query is blank" do
        create(:quote)

        expect(Quote.search_text(nil).count).to eq(1)
      end
    end
  end
end
