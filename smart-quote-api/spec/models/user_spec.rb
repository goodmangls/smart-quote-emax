require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_inclusion_of(:role).in_array(%w[admin user member]) }

    it "requires password minimum 6 characters" do
      user = build(:user, password: "short", password_confirmation: "short")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include("is too short (minimum is 6 characters)")
    end

    it "rejects invalid email format" do
      user = build(:user, email: "not-an-email")
      expect(user).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to have_many(:quotes).dependent(:nullify) }
  end

  describe "callbacks" do
    it "downcases email before save" do
      user = create(:user, email: "TEST@Example.COM")
      expect(user.reload.email).to eq("test@example.com")
    end
  end

  describe "has_secure_password" do
    it "authenticates with correct password" do
      user = create(:user, password: "password123")
      expect(user.authenticate("password123")).to eq(user)
    end

    it "rejects incorrect password" do
      user = create(:user, password: "password123")
      expect(user.authenticate("wrong")).to be_falsey
    end
  end
end
