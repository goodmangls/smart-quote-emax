require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module SmartQuoteApi
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Ruby 포맷 schema.rb 는 plpgsql 함수(next_quote_seq)를 표현하지 못한다.
    # schema.rb 로 만든 테스트 DB 에는 함수가 없어 프로덕션과 스키마가 어긋났고,
    # 그 탓에 채번 관련 스펙이 PG::InFailedSqlTransaction 으로 무너졌다.
    # structure.sql 로 덤프해 테스트 DB 가 프로덕션 스키마를 그대로 재현하게 한다.
    #
    # 주의: 20260314000001 이 이후 이름이 바뀐 MarginRule 상수를 참조해
    # `db:migrate` 를 처음부터 재생할 수 없다. structure.sql 재생성이 필요하면
    # 기존 DB 에 새 마이그레이션만 적용한 뒤 `db:schema:dump` 로 덤프할 것.
    config.active_record.schema_format = :sql

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Custom CORS Rack middleware - handles OPTIONS preflight at lowest level
    # Enable cookies for HttpOnly refresh-token auth in API-only mode.
    config.middleware.use ActionDispatch::Cookies
  end
end
