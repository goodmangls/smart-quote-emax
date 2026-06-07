require "rails_helper"

RSpec.describe AuthMailer, type: :mailer do
  describe "#magic_link_email" do
    let(:user) { create(:user, email: "test@example.com", name: "Alice") }
    let(:token) { "raw-sample-token-xyz" }

    around do |example|
      original = ENV["FRONTEND_URL"]
      ENV["FRONTEND_URL"] = "https://smart-quote-emax.test"
      example.run
      ENV["FRONTEND_URL"] = original
    end

    it "sends to the user's email with an English E-MAX subject" do
      mail = described_class.magic_link_email(user, token)

      expect(mail.to).to eq([ user.email ])
      expect(mail.subject).to eq("[E-MAX] Your sign-in link")
    end

    it "embeds the magic link URL with the raw token in both mail parts" do
      mail = described_class.magic_link_email(user, token)
      expected_url = "https://smart-quote-emax.test/auth/verify?token=#{token}"

      expect(mail.html_part.body.decoded).to include(expected_url)
      expect(mail.text_part.body.decoded).to include(expected_url)
    end

    it "renders a polished professional English HTML email" do
      mail = described_class.magic_link_email(user, token)
      html = mail.html_part.body.decoded

      expect(html).to include("Your secure sign-in link is ready")
      expect(html).to include("color:#ffffff; mso-line-height-rule:exactly;")
      expect(html).to include("E-MAX Smart Quote")
      expect(html).to include("Sign in securely")
      expect(html).to include("Security note")
      expect(html).to include("E-MAX Worldwide Express")
      expect(html).not_to include("로그인")
      expect(html).not_to include("안녕하세요")
    end

    it "renders a professional plain-text fallback" do
      mail = described_class.magic_link_email(user, token)
      text = mail.text_part.body.decoded

      expect(text).to include("E-MAX Smart Quote — Secure sign-in")
      expect(text).to include("Sign in securely:")
      expect(text).to include("E-MAX Worldwide Express · Smart Quote")
    end

    it "raises KeyError when FRONTEND_URL is unset" do
      ENV.delete("FRONTEND_URL")

      expect {
        described_class.magic_link_email(user, token).message
      }.to raise_error(KeyError)
    end
  end
end
