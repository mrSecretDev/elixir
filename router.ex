defmodule PayorlinkWeb.Router do
  use PayorlinkWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug PhoenixGon.Pipeline
    plug :protect_from_forgery
    plug PayorlinkWeb.FetchUrls
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :login_layout do
    plug :protect_from_forgery
    plug :put_layout, {PayorlinkWeb.LayoutView, :login}
  end

  pipeline :authenticate_layout do
    plug :protect_from_forgery
    plug :put_layout, {PayorlinkWeb.LayoutView, :authenticate}
  end

  pipeline :auth_layout do
    # plug PayorLinkWeb.Authenticate
    plug :put_layout, {PayorlinkWeb.LayoutView, :main}
    #plug Auth.SlidingSessionTimeout, timeout_after_seconds: 600
  end

  scope "/", PayorlinkWeb do
    pipe_through :browser

    get "/", SessionController, :new
    get "/register", SessionController, :register
  end

  scope "/", PayorlinkWeb do

    pipe_through :browser
    get "/dashboard", PageController, :index
    post "/dashboard", PageController, :new
  end

  scope "/", PayorlinkWeb do
  end

  scope "/", PayorlinkWeb do
    pipe_through [:browser, :login_layout]
    # get "/sign_in/payroll_code", SessionController, :login_payorlink
    # get "/authentication", SessionController, :index
    # post "/authentication", SessionController, :index
    get "/sign_in", SessionController, :new
    post "/sign_in", SessionController, :create
    post "/sign_in/payroll", SessionController, :create_payroll
    post "/sign_in/multiple_role", SessionController, :sign_in_multiple_role
    get "/change_password", UserController, :change_password
    post "/change_password", UserController, :submit_change_password
  end

    # GENERIC LOOK UP

  scope "/", PayorlinkWeb do
    pipe_through [:browser, :auth_layout]
    post "/get_data", SearchController, :get_data
    post "/get_data_v2/get_chief_complaints", SearchController, :get_chief_complaints
    post "/get_data_v2/get_diagnoses", SearchController, :get_diagnoses
    post "/get_data_v2/get_adjustments", SearchController, :get_adjustments
    post "/get_data_v2/get_procedure_amount", SearchController, :get_procedure_amount
    post "/get_data_v2/get_packages", SearchController, :get_packages
    post "/get_data_v2/get_ruvs", SearchController, :get_ruvs
    post "/get_data_v2/get_accounts", SearchController, :get_accounts
    post "/get_data_v2/get_miscellany", SearchController, :get_miscellany
    post "/get_data_v2/get_locations", SearchController, :get_locations

    scope "/authorization" do
      # get "/", AuthorizationController, :index
      post "/load_index", AuthorizationController, :load_index
      get "/view", AuthorizationController, :view
      post "/load_member_details", AuthorizationController, :load_member_details
      post "/load_practitioners", AuthorizationController, :load_practitioners
      post "/v1/loas/load_coverages", AuthorizationController, :load_coverages
      post "/v1/loas/load_reason", AuthorizationController, :load_generic_look_ups
      post "/v1/loas/load_generic", AuthorizationController, :load_generic_look_ups
      post "/v1/acu_clinic/load_member_procedures", AuthorizationController, :load_member_procedures
      post "/v1/acu_clinic/load_member_ruvs", AuthorizationController, :load_member_ruvs
      post "/v1/acu_clinic/load_member_facilities", AuthorizationController, :load_member_facilities
      post "/v1/acu_clinic/get_member_watchlist", AuthorizationController, :get_member_watchlist
      get "/loas/consult/edit", AuthorizationController, :edit_consult
      post "/request/search_authorizations", AuthorizationController, :search_authorizations
      post "/get_by_loa_no", AuthorizationController, :get_by_loa_no
      get "/request", AuthorizationController, :new
      post "/request", AuthorizationController, :create
      get "/request/setup", AuthorizationController, :setup
      put "/request/setup", AuthorizationController, :update_setup
      post "/request/setup", AuthorizationController, :update_setup
      post "/validate_consult_params", AuthorizationController, :validate_request_consult_params

      post "/request/search_facilities", AuthorizationController, :search_facilities
      post "/request/upload-valid-id", AuthorizationController, :upload_valid_id
      post "/request/upload-id", AuthorizationController, :upload_id
      post "/request/generate_security_questions", AuthorizationController, :generate_security_questions
      post "/request/answer_security_questions", AuthorizationController, :answer_security_questions
      post "/request/update_member_coverage", AuthorizationController, :update_member_coverage

      post "/request/member_authentication_card", AuthorizationController, :member_authentication_card
      post "/request/member_authentication_details", AuthorizationController, :member_authentication_details
      post "/request/get_member_info", AuthorizationController, :get_member_info
      post "/request/auto_compute", AuthorizationController, :auto_compute

      post "/request-acu", AuthorizationController, :request_acu
    end
  end

  scope "/", PayorlinkWeb do
    pipe_through [:browser, :authenticate_layout]
    get "/reset-password", SessionController, :reset_password
    post "/reset_password", SessionController, :update_password
    get "/forgot_password", SessionController, :forgot_password
    post "/forgot_password", SessionController, :send_verification
    post "/verify_otp", SessionController, :validate_otp
    post "/resend_otp", SessionController, :resend_otp

    # scope "/members" do
    #   get "/", PageController, :index
    #   get "/:card_no", PageController, :index
    # end

    scope "/members" do
      get "/", PageController, :index
      get "/view/:card_no", PageController, :index
      get "/search-member-edit-profile", PageController, :index
      get "/search-member-kyc", PageController, :index
      get "/member-enrollment/:step", PageController, :index
    end

    scope "/users" do
      get "/", PageController, :index
      get "/batch", PageController, :index
      get "/upload", PageController, :index
      get "/view/:code", PageController, :index
    end

    scope "/authorizations" do
      get "/", PageController, :index
      get "/request", PageController, :index
      get "/request/verify-member", PageController, :index
      get "/request/select-facility", PageController, :index
      get "/request/loa-details", PageController, :index
      get "/view/:id", PageController, :index
      get "/view/:id/:loa", PageController, :index
    end

    scope "/benefits" do
      get "/", PageController, :index
      get "/view/:id", PageController, :index
    end

    scope "/facilities" do
      get "/", PageController, :index
      get "/view/:id", PageController, :index
    end

    scope "/sample" do
      get "/", PageController, :index
    end

    scope "/accounts" do
      get "/", PageController, :index
      get "/view/:code", PageController, :index
      get "/request/select-facility", PageController, :index
      get "/request/loa-details", PageController, :index
      get "/edit/general/:code", PageController, :index
      get "/edit/financial/:code", PageController, :index
      get "/edit/clinic/:code", PageController, :index
      get "/renew/general/:code", PageController, :index
      get "/renew/financial/:code", PageController, :index
      get "/renew/clinic/:code", PageController, :index
      get "/renew/summary/:code", PageController, :index
      get "/view/renew/:code", PageController, :index
      get "/renew/edit/general/:code", PageController, :index
      get "/renew/edit/financial/:code", PageController, :index
      get "/renew/edit/clinic/:code", PageController, :index
      get "/renew/edit/summary/:code", PageController, :index
      get "/renew/step5/:code", PageController, :index
    end

    scope "/plans" do
      get "/", PageController, :index
      get "/view/:code", PageController, :index
      get "/view/benefit/:plan_code/:benefit_code", PageController, :index
      get "/view/accounts/:plan_code", PageController, :index
      get "/view/pec/:plan_code/:pec_code", PageController, :index
    end

    scope "/acu_schedules" do
      get "/", PageController, :index
      get "/view/:batch_no", PageController, :index
      get "/create/step1", PageController, :index
      get "/create/step2/:batch_no", PageController, :index
      get "/create/step3/:batch_no/:account_code", PageController, :index
      get "/create/step4/:batch_no", PageController, :index
      get "/create/step5/:batch_no", PageController, :index
      get "/download_report", PageController, :index

      get "/edit/step1/:batch_no", PageController, :index
    end

    scope "/exclusions" do
      get "/", PageController, :index
      get "/view/:plan_code/:code", PageController, :index
      get "/view/pec/:plan_code/:pec_code", PageController, :index
    end

    scope "/packages" do
      get "/view/:code", PageController, :index
    end

    get "/reports", PageController, :index

    scope "/roles" do
      get "/", PageController, :index
      get "/batch", PageController, :index
      get "/upload", PageController, :index
      get "/view/:code", PageController, :index
    end

    scope "/facilities" do
      get "/view", PageController, :index
      get "/edit/:facility_id", PageController, :index
      get "/create/:step", PageController, :index
      get "/create/add-procedure/:facility_id", PageController, :index
      get "/edit/add-packages/:facility_id", PageController, :index
    end
  end


  # Other scopes may use custom stacks.
  # scope "/api", PayorlinkWeb do
  #   pipe_through :api
  # end
end
