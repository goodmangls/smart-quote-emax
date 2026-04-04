class Customer < ApplicationRecord
  belongs_to :user, optional: true
  has_many :quotes, dependent: :nullify

  validates :company_name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  scope :recent, -> { order(updated_at: :desc) }
  scope :search_text, ->(q) {
    where("company_name ILIKE :q OR contact_name ILIKE :q OR email ILIKE :q", q: "%#{sanitize_sql_like(q)}%") if q.present?
  }
end
