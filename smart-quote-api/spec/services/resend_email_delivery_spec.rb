require "rails_helper"

RSpec.describe ResendEmailDelivery do
  around do |example|
    original = ENV["RESEND_API_KEY"]
    ENV["RESEND_API_KEY"] = "re_test_key"
    example.run
    ENV["RESEND_API_KEY"] = original
  end

  let(:mail) do
    Mail.new do
      from "no-reply@bridgelogis.com"
      to "user@example.com"
      subject "[E-MAX] Your sign-in link"
      text_part { body "Use this secure link." }
      html_part { content_type "text/html; charset=UTF-8"; body "<p>Use this secure link.</p>" }
    end
  end

  it "sends mail through Resend HTTP API" do
    request = stub_request(:post, "https://api.resend.com/emails")
      .with(
        headers: {
          "Authorization" => "Bearer re_test_key",
          "Content-Type" => "application/json"
        },
        body: hash_including(
          "from" => "no-reply@bridgelogis.com",
          "to" => [ "user@example.com" ],
          "subject" => "[E-MAX] Your sign-in link",
          "html" => include("secure link"),
          "text" => include("secure link")
        )
      )
      .to_return(status: 200, body: { id: "email_123" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(described_class.deliver!(mail)).to be true
    expect(request).to have_been_requested
  end

  it "raises a delivery error for non-success responses" do
    stub_request(:post, "https://api.resend.com/emails")
      .to_return(status: 500, body: "upstream unavailable")

    expect { described_class.deliver!(mail) }
      .to raise_error(ResendEmailDelivery::Error, /Resend API returned 500/)
  end
end
