class QuoteSearcher
  def self.call(scope, params)
    new(scope, params).call
  end

  def initialize(scope, params)
    @scope = scope
    @params = params
  end

  def call
    @scope
      .includes(:customer)
      .search_text(@params[:q])
      .by_destination(@params[:destination_country])
      .by_date_range(@params[:date_from], @params[:date_to])
      .by_status(@params[:status])
  end
end
