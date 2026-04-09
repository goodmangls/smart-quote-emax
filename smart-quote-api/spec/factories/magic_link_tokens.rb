FactoryBot.define do
  factory :magic_link_token do
    association :user
    token_digest { Digest::SHA256.hexdigest(SecureRandom.urlsafe_base64(32)) }
    expires_at { 15.minutes.from_now }
    used_at { nil }
  end
end
