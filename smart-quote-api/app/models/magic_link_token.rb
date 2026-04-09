class MagicLinkToken < ApplicationRecord
  belongs_to :user

  TOKEN_VALIDITY = 15.minutes

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at, presence: true

  def self.generate!(user)
    raw_token = SecureRandom.urlsafe_base64(32)
    digest    = Digest::SHA256.hexdigest(raw_token)
    create!(user: user, token_digest: digest, expires_at: TOKEN_VALIDITY.from_now)
    raw_token
  end

  def self.find_valid_token!(raw_token)
    digest = Digest::SHA256.hexdigest(raw_token)
    token  = find_by!(token_digest: digest)
    raise ActiveRecord::RecordNotFound if token.used_at.present?
    raise ActiveRecord::RecordNotFound if token.expires_at < Time.current
    token
  end

  def expired?
    expires_at < Time.current
  end

  def used?
    used_at.present?
  end

  def consume!
    touch(:used_at)
  end
end
