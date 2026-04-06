# Pure Rack CORS middleware - inserted at position 0, runs before everything
class CorsRackMiddleware
  ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD".freeze
  ALLOWED_HEADERS = "Origin, Content-Type, Accept, Authorization, X-Requested-With".freeze
  EXPOSED_HEADERS = "Authorization".freeze

  def initialize(app)
    @app = app
  end

  def call(env)
    origin = env["HTTP_ORIGIN"]

    # Short-circuit OPTIONS preflight immediately - never reaches Rails router
    if env["REQUEST_METHOD"] == "OPTIONS"
      return [
        200,
        cors_headers(origin).merge("Content-Length" => "0", "Content-Type" => "text/plain"),
        []
      ]
    end

    status, headers, body = @app.call(env)
    cors_headers(origin).each { |k, v| headers[k] = v } if origin
    [ status, headers, body ]
  end

  private

  def cors_headers(origin)
    {
      "Access-Control-Allow-Origin"   => origin || "*",
      "Access-Control-Allow-Methods"  => ALLOWED_METHODS,
      "Access-Control-Allow-Headers"  => ALLOWED_HEADERS,
      "Access-Control-Expose-Headers" => EXPOSED_HEADERS,
      "Access-Control-Max-Age"        => "600"
    }
  end
end
