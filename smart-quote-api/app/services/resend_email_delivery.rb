require "json"
require "net/http"

class ResendEmailDelivery
  class Error < StandardError; end

  API_ENDPOINT = URI("https://api.resend.com/emails")

  def self.deliver!(mail)
    new(mail).deliver!
  end

  def initialize(mail)
    @mail = mail
  end

  def deliver!
    response = http.request(request)
    return true if response.is_a?(Net::HTTPSuccess)

    raise Error, "Resend API returned #{response.code}: #{response.body.to_s[0, 300]}"
  rescue Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED, SocketError => e
    raise Error, e.message
  end

  private

  attr_reader :mail

  def http
    Net::HTTP.new(API_ENDPOINT.host, API_ENDPOINT.port).tap do |client|
      client.use_ssl = true
      client.open_timeout = 10
      client.read_timeout = 20
    end
  end

  def request
    Net::HTTP::Post.new(API_ENDPOINT).tap do |req|
      req["Authorization"] = "Bearer #{ENV.fetch('RESEND_API_KEY')}"
      req["Content-Type"] = "application/json"
      req.body = payload.to_json
    end
  end

  def payload
    {
      from: mail[:from].to_s,
      to: Array(mail.to),
      subject: mail.subject,
      html: html_body,
      text: text_body
    }.compact
  end

  def html_body
    mail.html_part&.body&.decoded || (mail.mime_type == "text/html" ? mail.body.decoded : nil)
  end

  def text_body
    mail.text_part&.body&.decoded || (mail.mime_type == "text/plain" ? mail.body.decoded : nil)
  end
end
