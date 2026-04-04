class QuoteMailer < ApplicationMailer
  default from: ENV.fetch("MAILER_FROM", "quotes@goodmangls.com")

  def send_quote(quote, recipient_email, recipient_name: nil, message: nil)
    @quote = quote
    @recipient_name = recipient_name || "Customer"
    @message = message

    mail(
      to: recipient_email,
      subject: "Quote #{quote.reference_no} - Goodman GLS & J-Ways"
    )
  end
end
