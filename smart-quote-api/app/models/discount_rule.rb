class DiscountRule < ApplicationRecord
  RULE_TYPES = %w[flat weight_based].freeze

  validates :name, presence: true, length: { maximum: 100 }
  validates :rule_type, presence: true, inclusion: { in: RULE_TYPES }
  validates :priority, presence: true, numericality: { only_integer: true, in: 0..200 }
  validates :discount_percent, presence: true, numericality: { greater_than_or_equal_to: 5, less_than_or_equal_to: 50 }
  validates :weight_min, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :weight_max, numericality: { greater_than: 0 }, allow_nil: true

  validate :weight_range_consistency

  scope :active, -> { where(is_active: true) }
  scope :by_priority, -> { order(priority: :desc, id: :asc) }

  private

  def weight_range_consistency
    return unless weight_min && weight_max
    errors.add(:weight_max, "must be greater than weight_min") if weight_max <= weight_min
  end
end
