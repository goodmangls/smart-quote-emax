admin_password = ENV.fetch("ADMIN_DEFAULT_PASSWORD", "password")

[
  { email: "jhlim725@gmail.com", name: "Admin", company: "E-MAX Worldwide Express" }
].each do |attrs|
  User.find_or_create_by!(email: attrs[:email]) do |u|
    u.password = admin_password
    u.password_confirmation = admin_password
    u.role = "admin"
    u.name = attrs[:name]
    u.company = attrs[:company]
  end
end

puts "Seeded #{User.count} admin users."

# Margin Rules
load Rails.root.join("db/seeds/margin_rules.rb")
