require "csv"

class QuoteExporter
  MAX_EXPORT_COUNT = 10_000

  HEADERS = [
    "Reference No", "Date", "Destination", "Incoterm", "Billable Weight (kg)",
    "Total Cost (KRW)", "Quote Amount (KRW)", "Quote Amount (USD)", "Discount %", "Status"
  ].freeze

  def self.call(scope)
    new(scope).call
  end

  def initialize(scope)
    @scope = scope
  end

  # Returns { csv_data:, count: } or raises TooLargeError
  def call
    count = @scope.count

    if count > MAX_EXPORT_COUNT
      raise TooLargeError, "Too many records (max #{MAX_EXPORT_COUNT}). Please narrow your filters."
    end

    csv_data = generate_csv
    { csv_data: csv_data, count: count }
  end

  class TooLargeError < StandardError; end

  private

  def generate_csv
    CSV.generate(headers: true) do |csv|
      csv << HEADERS

      @scope.find_each do |q|
        csv << [
          q.reference_no,
          q.created_at.strftime("%Y-%m-%d"),
          q.destination_country,
          q.incoterm,
          q.billable_weight.to_f,
          q.total_cost_amount.to_i,
          q.total_quote_amount.to_i,
          q.total_quote_amount_usd.to_f.round(2),
          q.applied_discount_percent.to_f,
          q.status
        ]
      end
    end
  end
end
