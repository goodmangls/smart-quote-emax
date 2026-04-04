class Surcharge < ApplicationRecord
  CHARGE_TYPES = %w[fixed rate].freeze
  CARRIERS = %w[UPS DHL EMAX].freeze

  validates :code, presence: true, uniqueness: true, length: { maximum: 50 }
  validates :name, presence: true, length: { maximum: 100 }
  validates :charge_type, presence: true, inclusion: { in: CHARGE_TYPES }
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :carrier, inclusion: { in: CARRIERS }, allow_nil: true
  validates :effective_from, presence: true

  validate :effective_date_consistency

  scope :active, -> { where(is_active: true) }
  scope :currently_effective, -> {
    today = Date.current
    where("effective_from <= ?", today)
      .where("effective_to IS NULL OR effective_to >= ?", today)
  }
  scope :for_carrier, ->(carrier) {
    where("carrier IS NULL OR carrier = ?", carrier)
  }
  scope :by_code, -> { order(:code) }

  # Returns comma-separated country_codes as an array
  def country_codes_array
    (country_codes || "").split(",").map(&:strip).reject(&:empty?)
  end

  # Check if this surcharge matches a given country
  def matches_country?(country)
    codes = country_codes_array
    codes.empty? || codes.include?(country)
  end

  # Check if this surcharge matches a given zone
  def matches_zone?(zone_key)
    self.zone.nil? || self.zone == zone_key
  end

  private

  def effective_date_consistency
    return unless effective_from && effective_to
    errors.add(:effective_to, "must be after effective_from") if effective_to < effective_from
  end
end
