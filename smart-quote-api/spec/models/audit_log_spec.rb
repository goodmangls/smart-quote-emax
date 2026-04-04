require "rails_helper"

RSpec.describe AuditLog, type: :model do
  describe "validations" do
    it { should validate_presence_of(:action) }
    it { should validate_presence_of(:resource_type) }
    it { should validate_inclusion_of(:action).in_array(AuditLog::ACTIONS) }
  end

  describe "associations" do
    it { should belong_to(:user).optional }
  end

  describe ".track!" do
    let(:user) { create(:user) }
    let(:quote) { create(:quote, user: user) }

    it "creates an audit log entry" do
      expect {
        AuditLog.track!(user: user, action: "quote.created", resource: quote, ip_address: "127.0.0.1")
      }.to change(AuditLog, :count).by(1)
    end

    it "stores all attributes correctly" do
      log = AuditLog.track!(
        user: user,
        action: "quote.status_changed",
        resource: quote,
        metadata: { status_from: "draft", status_to: "sent" },
        ip_address: "10.0.0.1"
      )

      expect(log.user).to eq(user)
      expect(log.action).to eq("quote.status_changed")
      expect(log.resource_type).to eq("Quote")
      expect(log.resource_id).to eq(quote.id)
      expect(log.resource_ref).to eq(quote.reference_no)
      expect(log.metadata).to eq({ "status_from" => "draft", "status_to" => "sent" })
      expect(log.ip_address).to eq("10.0.0.1")
    end

    it "does not raise on failure" do
      expect {
        AuditLog.track!(user: user, action: "invalid_action", resource: quote)
      }.not_to raise_error
    end
  end

  describe "scopes" do
    let(:user) { create(:user) }
    let(:quote) { create(:quote, user: user) }

    before do
      AuditLog.track!(user: user, action: "quote.created", resource: quote)
      AuditLog.track!(user: user, action: "quote.deleted", resource: quote)
    end

    it ".recent orders by created_at desc" do
      logs = AuditLog.recent
      expect(logs.first.created_at).to be >= logs.last.created_at
    end

    it ".by_action filters by action" do
      expect(AuditLog.by_action("quote.created").count).to eq(1)
      expect(AuditLog.by_action("quote.deleted").count).to eq(1)
    end

    it ".for_resource filters by type and id" do
      expect(AuditLog.for_resource("Quote", quote.id).count).to eq(2)
    end
  end
end
