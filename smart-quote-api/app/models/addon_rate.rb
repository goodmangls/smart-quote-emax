class AddonRate < ApplicationRecord
  CHARGE_TYPES = %w[fixed per_piece per_carton calculated].freeze
  UNITS = %w[shipment piece carton].freeze
  CARRIERS = %w[UPS DHL].freeze

  validates :code, presence: true, length: { maximum: 20 }
  validates :carrier, presence: true, inclusion: { in: CARRIERS }
  validates :name_en, presence: true, length: { maximum: 100 }
  validates :name_ko, presence: true, length: { maximum: 100 }
  validates :charge_type, presence: true, inclusion: { in: CHARGE_TYPES }
  validates :unit, presence: true, inclusion: { in: UNITS }
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :effective_from, presence: true
  validates :code, uniqueness: { scope: :carrier }

  validate :effective_date_consistency

  scope :active, -> { where(is_active: true) }
  scope :currently_effective, -> {
    today = Date.current
    where("effective_from <= ?", today)
      .where("effective_to IS NULL OR effective_to >= ?", today)
  }
  scope :for_carrier, ->(carrier) { where(carrier: carrier) }
  scope :ordered, -> { order(:sort_order, :code) }

  private

  def effective_date_consistency
    return unless effective_from && effective_to
    errors.add(:effective_to, "must be after effective_from") if effective_to < effective_from
  end
end
