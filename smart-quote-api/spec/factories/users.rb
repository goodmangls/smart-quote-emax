FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    password_confirmation { "password123" }
    name { "Test User" }
    company { "Test Corp" }
    nationality { "South Korea" }
    role { "user" }

    trait :admin do
      role { "admin" }
      sequence(:email) { |n| "admin#{n}@goodmangls.com" }
    end
  end
end
