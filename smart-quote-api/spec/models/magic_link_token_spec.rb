require "rails_helper"

RSpec.describe MagicLinkToken, type: :model do
  let(:user) { create(:user) }

  describe "validations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to validate_presence_of(:token_digest) }
    it { is_expected.to validate_presence_of(:expires_at) }
  end

  describe ".generate!" do
    it "returns a raw token string" do
      raw_token = MagicLinkToken.generate!(user)
      expect(raw_token).to be_a(String)
      expect(raw_token.length).to be > 20
    end

    it "creates a MagicLinkToken record for the user" do
      expect { MagicLinkToken.generate!(user) }.to change(MagicLinkToken, :count).by(1)
    end

    it "sets expires_at to 15 minutes from now" do
      raw_token = MagicLinkToken.generate!(user)
      token = MagicLinkToken.last
      expect(token.expires_at).to be_within(5.seconds).of(15.minutes.from_now)
    end

    it "stores a SHA256 digest, not the raw token" do
      raw_token = MagicLinkToken.generate!(user)
      token = MagicLinkToken.last
      expect(token.token_digest).to eq(Digest::SHA256.hexdigest(raw_token))
      expect(token.token_digest).not_to eq(raw_token)
    end

    it "leaves used_at nil" do
      MagicLinkToken.generate!(user)
      expect(MagicLinkToken.last.used_at).to be_nil
    end
  end

  describe ".find_valid_token!" do
    let(:raw_token) { MagicLinkToken.generate!(user) }

    it "returns the token record for a valid raw token" do
      token = MagicLinkToken.find_valid_token!(raw_token)
      expect(token).to be_a(MagicLinkToken)
      expect(token.user).to eq(user)
    end

    it "raises RecordNotFound for an unknown token" do
      expect { MagicLinkToken.find_valid_token!("nonexistent_token") }
        .to raise_error(ActiveRecord::RecordNotFound)
    end

    it "raises RecordNotFound for an already used token" do
      token_record = MagicLinkToken.find_valid_token!(raw_token)
      token_record.consume!
      expect { MagicLinkToken.find_valid_token!(raw_token) }
        .to raise_error(ActiveRecord::RecordNotFound)
    end

    it "raises RecordNotFound for an expired token" do
      raw_token  # trigger creation
      MagicLinkToken.last.update!(expires_at: 1.minute.ago)
      expect { MagicLinkToken.find_valid_token!(raw_token) }
        .to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "#expired?" do
    it "returns false when token has not expired" do
      token = build(:magic_link_token, user: user, expires_at: 10.minutes.from_now)
      expect(token.expired?).to be false
    end

    it "returns true when token has expired" do
      token = build(:magic_link_token, user: user, expires_at: 1.minute.ago)
      expect(token.expired?).to be true
    end
  end

  describe "#used?" do
    it "returns false when used_at is nil" do
      token = build(:magic_link_token, user: user, used_at: nil)
      expect(token.used?).to be false
    end

    it "returns true when used_at is set" do
      token = build(:magic_link_token, user: user, used_at: Time.current)
      expect(token.used?).to be true
    end
  end

  describe "#consume!" do
    it "sets used_at to current time" do
      raw_token = MagicLinkToken.generate!(user)
      token = MagicLinkToken.last
      expect(token.used_at).to be_nil
      token.consume!
      expect(token.reload.used_at).not_to be_nil
    end
  end
end
