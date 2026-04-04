class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  ACTIONS = %w[
    quote.created quote.updated quote.deleted
    quote.status_changed quote.email_sent quote.exported
    discount_rule.created discount_rule.updated discount_rule.deleted
    surcharge.created surcharge.updated surcharge.deleted
    addon_rate.created addon_rate.updated addon_rate.deleted
    fsc.updated
  ].freeze

  validates :action, presence: true, inclusion: { in: ACTIONS }
  validates :resource_type, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_resource, ->(type, id) { where(resource_type: type, resource_id: id) }
  scope :by_action, ->(action) { where(action: action) if action.present? }

  def self.track!(user:, action:, resource:, metadata: {}, ip_address: nil)
    create!(
      user: user,
      action: action,
      resource_type: resource.class.name,
      resource_id: resource.id,
      resource_ref: resource.try(:reference_no),
      metadata: metadata,
      ip_address: ip_address
    )
  rescue StandardError => e
    Rails.logger.error "[AUDIT] Failed to log #{action}: #{e.message}"
  end
end
