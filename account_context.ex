defmodule Data.Contexts.AccountContext do
  @moduledoc false

  import Ecto.Query, warn: false

  alias ApiWeb.Request

  alias Ecto.Changeset

  alias Data.Contexts.UtilityContext
  alias Data.Repo
  alias Data.Schemas.{
    Account,
    AccountUser
  }

  def validate_params(:register_account_user, params, _info) do
    fields = %{
      account_code: :string,
      username: :string,
      password: :string,
      confirm_password: :string,
      first_name: :string,
      last_name: :string,
      middle_name: :string,
      suffix: :string,
      email_address: :string,
      mobile_number: :string
    }

    changeset =
      {%{}, fields}
      |> Changeset.cast(params, Map.keys(fields))
      |> validate_account_code()
      |> validate_email()
      |> validate_mobile()
      |> validate_username()
      |> validate_password_and_confirm_password()
      |> validate_name()

    {changeset.valid?, changeset}
  end

  defp validate_account_code(changeset) do
    changeset
    |> Changeset.validate_required(:account_code, message: "Enter account code")
    |> Changeset.validate_length(:account_code, max: 20, message: "Must only accept a maximum of 20 alphanumeric characters")
    |> validate_account_code_if_exist()
  end

  defp validate_account_code_if_exist(%{valid?: false} = changeset), do: changeset
  defp validate_account_code_if_exist(%{valid?: true, changes: %{account_code: account_code}} = changeset) do
    date_today = Timex.format!(Timex.to_date(Timex.now()), "{0YYYY}-{0M}-{0D}")

    Account
    |> where([a],
      a.code == ^account_code and
      a.effective_date <= ^date_today and
      a.expiry_date >= ^date_today
    )
    |> order_by([a], desc: fragment("string_to_array(?, '.', '')::int[]", a.version))
    |> limit(1)
    |> Repo.one()
    |> validate_account_code_if_exist(changeset)
  end

  defp validate_account_code_if_exist(nil, changeset) do
    changeset
    |> Changeset.add_error(:account_code, "Invalid account code")
  end

  defp validate_account_code_if_exist(%{status: "A"}, changeset), do: changeset

  defp validate_account_code_if_exist(%{status: _}, changeset) do
    changeset
    |> Changeset.add_error(:account_code, "Account is not active")
  end

  defp validate_username(changeset) do
    changeset
    |> Changeset.validate_required(:username, message: "Enter username")
    |> Changeset.validate_length(
      :username,
      min: 7,
      message: "Username is already taken or invalid. Please try again"
    )
    |> Changeset.validate_length(
      :username,
      max: 80,
      message: "Username is already taken or invalid. Please try again"
    )
    |> Changeset.validate_format(
      :username,
      ~r/^[ A-Za-z0-9_@.#$%]*$/,
      message: "Username is already taken or invalid. Please try again"
    )
    |> validate_username_if_already_exist()
  end

  defp validate_username_if_already_exist(%{changes: %{username: username, account_code: _account_code}} = changeset) do
    AccountUser
    |> where([au],
      au.username == ^username
    )
    |> select([au], au.username)
    |> limit(1)
    |> Repo.one()
    |> validate_username_if_already_exist(changeset)
  end

  defp validate_username_if_already_exist(changeset), do: changeset

  defp validate_username_if_already_exist(nil, changeset), do: changeset

  defp validate_username_if_already_exist(_, changeset) do
    changeset
    |> Changeset.add_error(:username, "Username is already taken or invalid. Please try again")
  end

  defp validate_password_and_confirm_password(changeset) do
    changeset
    |> Changeset.validate_required(:password, message: "Enter password")
    |> Changeset.validate_required(:confirm_password, message: "Enter confirm password")
    |> validate_password_format()
  end

  defp validate_password_format(%{changes: %{password: password}} = changeset) do
    true
    |> match_password(password, ~r/(?=.*?[0-9])/)
    |> match_password(password, ~r/(?=.*?[A-Z])/)
    |> match_password(password, ~r/(?=.*?[.#?!@$%^&*-])/)
    |> password_length(String.length(password))
    |> validate_password_format_if_correct(changeset)
  end

  defp validate_password_format(changeset), do: changeset

  defp match_password(false, _password, _regex), do: false

  defp match_password(true, password, regex) do
    Regex.match?(regex, password)
  end

  defp password_length(true, length) when 8 <= length do
    true
  end

  defp password_length(true, length) when length >= 80 do
    true
  end

  defp password_length(true, _length), do: false

  defp password_length(false, _length), do: false

  defp validate_password_format_if_correct(true, changeset) do
    changeset
    |> validate_password_and_confirm_password_if_equal()
  end

  defp validate_password_format_if_correct(false, changeset) do
    changeset
    |> Changeset.add_error(:password, "Password does not meet the requirements. Please try again")
  end

  defp validate_password_and_confirm_password_if_equal(%{changes: %{password: password, confirm_password: confirm_password}} = changeset) do
    if password === confirm_password do
      changeset
    else
      changeset
      |> Changeset.add_error(:confirm_password, "Your passwords do not match. Please try again")
    end
  end

  defp validate_password_and_confirm_password_if_equal(changeset), do: changeset

  defp validate_name(changeset) do
    changeset
    |> validate_first_name()
    |> validate_last_name()
    |> validate_middle_name()
    |> validate_suffix()
  end

  defp validate_first_name(changeset) do
    changeset
    |> Changeset.validate_required(:first_name, message: "Enter first name")
    |> Changeset.validate_length(:first_name, max: 80, message: "First name only accepts alphanumeric value up to 80 characters")
    |> Changeset.validate_format(
      :first_name,
      ~r/^[ A-Za-z0-9.,'"-]*$/,
      message: "First name only accepts special characters dot (.), comma (,), apostrophe ('), quotation mark (''), and hyphen(-)"
    )
  end

  defp validate_last_name(changeset) do
    changeset
    |> Changeset.validate_required(:last_name, message: "Enter last name")
    |> Changeset.validate_length(:last_name, max: 80, message: "Last name only accepts alphanumeric value up to 80 characters")
    |> Changeset.validate_format(
      :last_name,
      ~r/^[ A-Za-z0-9.,'"-]*$/,
      message: "Last name only accepts special characters dot (.), comma (,), apostrophe ('), quotation mark (''), and hyphen(-)"
    )
  end

  defp validate_middle_name(changeset) do
    changeset
    |> Changeset.validate_length(:middle_name, max: 80, message: "Middle name only accepts alphanumeric value up to 80 characters")
    |> Changeset.validate_format(
      :middle_name,
      ~r/^[ A-Za-z0-9.,'"-]*$/,
      message: "Middle name only accepts special characters dot(.), comma(,), apostrophe('), quotation mark(''), and hyphen(-)"
    )
  end

  defp validate_suffix(changeset) do
    changeset
    |> Changeset.validate_length(:suffix, max: 10, message: "Suffix only accepts alphanumeric value up to 10 characters")
    |> Changeset.validate_format(
      :suffix,
      ~r/^[ A-Za-z0-9.,'"-]*$/,
      message: "Suffix only accepts special characters dot(.), comma(,), apostrophe ('), quotation mark (''), and hyphen(-)"
    )
  end

  defp validate_email(changeset) do
    changeset
    |> Changeset.validate_required(:email_address, message: "Enter email address")
    |> Changeset.validate_format(
      :email_address,
      ~r/^[A-Za-z0-9.-_@]*$/,
      message: "Email address is already taken or invalid"
    )
    |> Changeset.validate_length(:email_address, max: 80, message: "Email address is already taken or invalid")
  end

  defp validate_mobile(changeset) do
    changeset
    |> Changeset.validate_required(:mobile_number, message: "Enter mobile number")
    |> Changeset.validate_length(:mobile_number, max: 10, message: "Mobile number is already taken or invalid")
    |> Changeset.validate_format(:mobile_number, ~r/^[0-9]*$/, message: "Mobile number is already taken or invalid")
  end

  def register_account_user({:error, changeset}, _info), do: {:error, changeset}
  def register_account_user(params, info) do
    graphql_params = set_to_graphql(params)
    if Application.get_env(:data, :env) === :test do
      %{
        account_code: params[:account_code],
        first_name: params[:first_name],
        last_name: params[:last_name],
        middle_name: params[:middle_name],
        suffix: params[:suffix],
        username: params[:username],
        email_address: params[:email_address],
        mobile: params[:mobile_number]
      }
    else
      url = Request.process_request_url(info, :auth_url, "/api/graphql")

      info
      |> UtilityContext.request_api_graphql(url, graphql_params)
      |> insert_account_user(params)
    end
  end

  defp insert_account_user({:ok, %{"data" => %{"registerAccountUser" => register_account_user}}}, params)
  when register_account_user !== nil
  do
    fields =
      params
      |> setup_params_for_account_user(register_account_user["id"])

    %AccountUser{}
    |> AccountUser.changeset(fields)
    |> Repo.insert()
    |> set_result(params)
  end

  defp insert_account_user({:ok, errors}, _params) do
    {:error, errors["errors"]}
  end

  defp insert_account_user(_, _params) do
    {:error, [%{"message" => "Something went wrong. Please try again later."}]}
  end

  defp set_result({:error, _}, _params) do
    {:error, [%{"message" => "Something went wrong. Please try again later."}]}
  end

  defp set_result({:ok, user}, params) do
    %{
      user_id: user.user_id,
      account_code: params[:account_code],
      first_name: params[:first_name],
      last_name: params[:last_name],
      middle_name: params[:middle_name],
      suffix: params[:suffix],
      username: params[:username],
      email_address: params[:email_address],
      mobile: params[:mobile_number]
    }
  end

  defp setup_params_for_account_user(params, user_id) do
    %{
      account_code: params[:account_code],
      username: params[:username],
      password: UtilityContext.encrypt_data(params[:password]),
      user_id: user_id
    }
  end

  defp set_to_graphql(params) do
    """
    mutation {
     registerAccountUser(
        account_code: "#{params[:account_code]}",
        username: "#{params[:username]}",
        password: "#{params[:password]}",
        confirm_password: "#{params[:confirm_password]}",
        first_name: "#{replace_string(params[:first_name])}",
        last_name: "#{replace_string(params[:last_name])}",
        middle_name: "#{replace_string(params[:middle_name])}",
        suffix: "#{replace_string(params[:suffix])}",
        email_address: "#{params[:email_address]}",
        mobile_number: "#{params[:mobile_number]}"
      ){
        id
        username
        first_name
        last_name
        middle_name
        suffix
        email
        mobile
      }
    }
   """
  end

  defp replace_string(nil), do: nil
  defp replace_string(string), do: String.replace(string, "\"", "\\\"")

  def get_account_details(nil), do: {:error, %{message: "Invalid account"}}
  def get_account_details(code) do
    date_today = Timex.format!(Timex.to_date(Timex.now()), "{0YYYY}-{0M}-{0D}")

    account =
      Account
      |> where([a],
        a.code == ^code and
        a.effective_date <= ^date_today and
        a.expiry_date >= ^date_today and
        a.status == ^"A"
      )
      |> select([a], %{
        name: a.name,
        code: a.code,
        type: a.type,
        original_effective_date: fragment("to_char(?, 'MON-DD-YYYY')", a.original_effective_date),
        effective_date: fragment("to_char(?, 'MON-DD-YYYY')", a.effective_date),
        expiry_date: fragment("to_char(?, 'MON-DD-YYYY')", a.expiry_date),
        status: a.status,
        address: a.address,
        segment: a.segment,
        version: a.version
      })
      |> order_by([a], desc: fragment("string_to_array(?, '.', '')::int[]", a.version))
      |> limit(1)
      |> Repo.one()

    if is_nil(account) do
      {:error, %{message: "Account does not exist"}}
    else
      {:ok, account}
    end
  end
end
