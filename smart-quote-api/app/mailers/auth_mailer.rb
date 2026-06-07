class AuthMailer < ApplicationMailer
  def magic_link_email(user, raw_token)
    @user = user
    @expires_in_minutes = 15
    @magic_url = "#{ENV.fetch('FRONTEND_URL')}/auth/verify?token=#{raw_token}"

    mail(to: user.email, subject: "[E-MAX] Your sign-in link")
  end
end
