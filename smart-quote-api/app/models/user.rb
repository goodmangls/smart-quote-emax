class User < ApplicationRecord
  has_secure_password

  has_many :quotes, dependent: :nullify
  has_many :customers, dependent: :nullify

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: %w[admin user member] }
  validate :networks_must_be_valid

  VALID_NETWORKS = %w[WCA MPL EAN JCtrans].freeze

  after_initialize :set_default_role, if: :new_record?
  validates :password, length: { minimum: 6 }, if: :password_required?

  before_save :downcase_email

  private

  def set_default_role
    self.role ||= "user"
  end

  def downcase_email
    self.email = email.downcase.strip
  end

  def password_required?
    new_record? || password.present?
  end

  def networks_must_be_valid
    return unless respond_to?(:networks)
    return if networks.blank?

    invalid = networks - VALID_NETWORKS
    if invalid.any?
      errors.add(:networks, "contains invalid values: #{invalid.join(', ')}")
    end
  end
end
