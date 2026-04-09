class AuthMailer < ApplicationMailer
  def magic_link_email(user, raw_token)
    @user       = user
    @magic_url  = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/auth/verify?token=#{raw_token}"
    @expires_in = "15분 (15 minutes)"
    mail(to: user.email, subject: "[E-MAX] 로그인 링크 / Login Link")
  end
end
