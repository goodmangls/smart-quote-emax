class Quote < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :customer, optional: true

  VALID_INCOTERMS = %w[EXW FOB C&F CIF DAP DDP].freeze
  VALID_PACKING_TYPES = %w[NONE WOODEN_BOX SKID VACUUM].freeze
  VALID_STATUSES = %w[draft sent accepted rejected confirmed expired].freeze
  DEFAULT_VALIDITY_DAYS = 7

  validates :reference_no, presence: true, uniqueness: true
  validates :destination_country, presence: true, length: { maximum: 3 }
  validates :incoterm, presence: true, inclusion: { in: VALID_INCOTERMS }
  validates :packing_type, presence: true, inclusion: { in: VALID_PACKING_TYPES }
  validates :discount_percent, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_quote_amount, presence: true
  validates :total_cost_amount, presence: true
  validates :items, presence: true
  validates :breakdown, presence: true
  validates :status, inclusion: { in: VALID_STATUSES }

  scope :recent, -> { order(created_at: :desc) }
  scope :stale_drafts, -> {
    where(status: %w[draft sent])
      .where("validity_date < ?", Date.current)
  }
  scope :by_destination, ->(country) { where(destination_country: country) if country.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_date_range, ->(from, to) {
    scope = all
    if from.present?
      parsed_from = Date.parse(from.to_s) rescue nil
      scope = scope.where("created_at >= ?", parsed_from) if parsed_from
    end
    if to.present?
      parsed_to = Date.parse(to.to_s) rescue nil
      scope = scope.where("created_at <= ?", parsed_to.end_of_day) if parsed_to
    end
    scope
  }
  scope :search_text, ->(q) {
    where("reference_no ILIKE :q OR destination_country ILIKE :q", q: "%#{sanitize_sql_like(q)}%") if q.present?
  }

  before_validation :generate_reference_no, on: :create
  before_create :set_validity_date

  def expired?
    validity_date.present? && validity_date < Date.current && %w[draft sent].include?(status)
  end

  private

  def set_validity_date
    self.validity_date ||= (created_at || Time.current).to_date + DEFAULT_VALIDITY_DAYS
  end

  def generate_reference_no
    return if reference_no.present?

    year = Time.current.year
    last = self.class.where("reference_no LIKE ?", "SQ-#{year}-%").order(:reference_no).last
    seq = last ? last.reference_no.split("-").last.to_i + 1 : 1
    self.reference_no = "SQ-#{year}-#{seq.to_s.rjust(4, '0')}"
  end
end
