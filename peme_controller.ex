defmodule ApiWeb.V1.PemeController do
  use ApiWeb, :controller

  alias Data.Contexts.PemeContext, as: PC
  alias Data.Contexts.UtilityContext, as: UC
  alias Data.Contexts.ValidationContext, as: VC

  alias ApiWeb.{
    ErrorView,
    PemeView
  }

  plug :can_access?,
       %{module_name: "PEME", permissions: ["FA"]}
       when action in [
        :generate_evouchers,
        :export_evoucher,
        :cancel_evoucher,
        :share_evouchers,
        :encode_applicant_details,
        :download_loa
      ]

  ### Start of PEME Controller Functions ###
  ### Place all controller functions here ###

  def encode_applicant_details(conn, params) do
    :encode_applicant_details
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.encode_applicant_details(conn)
    |> return_result("encode_applicant_details.json", conn)
  rescue
    DBConnection.ConnectionError ->
      return_error_result(conn, "Connection was dropped. Please try again.")
  end

  def generate_evouchers(conn, params) do
    params = Map.put(params, "account_code", conn.private[:account_code])
    :generate
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.generate_evoucher(conn)
    |> return_result("generate_peme_evoucher.json", conn)
  rescue
    DBConnection.ConnectionError ->
      return_error_result(conn, "Connection was dropped. Please try again.")
  end

  def export_evoucher(conn, params) do
    :export
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.export_evoucher()
    |> return_result("export_evoucher.json", conn)
  end

  def cancel_evoucher(conn, params) do
    :cancel
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.cancel_evoucher(:cancel)
    |> return_result("cancel_evoucher.json", conn)
  end

  def download_loa(conn, params) do
    :download_loa
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.download_loa(conn)
    |> return_result("download_loa.json", conn)
  end

  def download_loa_self_service(conn, params) do
    :download_loa_self_service
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.download_loa(conn)
    |> return_result("download_loa.json", conn)
  end

  def share_evouchers(conn, params) do
    :share_evouchers
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.share_evouchers(conn)
    |> return_result("generate_peme_evoucher.json", conn)
  end

  def sign_in(conn, params) do
    :sign_in
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.sso_sign_in(conn)
    |> PC.return_sign_in_applicant()
    |> return_result("export_evoucher.json", conn)
  end

  def reprint_loa(conn, params) do
    :reprint_loa
    |> PC.validate_params(params)
    |> VC.valid_changeset()
    |> PC.download_loa(conn)
    |> return_result("download_loa.json", conn)
  end

  ### End of PEME Controller Functions ###

  ### Start of Return result functions ###
  ### Place all return result functions here ###

  defp return_error_result(conn, message) do
    conn
    |> put_status(200)
    |> put_view(ErrorView)
    |> render("error.json", error: message)
  end

  defp return_result({:error, changeset}, _, conn) do
    conn
    |> put_status(200)
    |> put_view(ErrorView)
    |> render("error.json", error: UC.transform_error_message(changeset))
  end

  defp return_result({content, filename}, "export_evoucher.json", conn) do
    if Application.get_env(:api, :env) == :test do
      conn
      |> put_status(200)
      |> put_view(PemeView)
      |> render("export_evoucher.json", result: %{message: "success"})
    else
      conn
      |> put_resp_content_type("application/pdf")
      |> put_resp_header("content-disposition", "inline; filename=#{filename}.pdf")
      |> send_resp(200, content)
    end
  end

  defp return_result({content, filename}, "download_loa.json", conn) do
    if Application.get_env(:api, :env) == :test do
      conn
      |> put_status(200)
      |> put_view(PemeView)
      |> render("download_loa.json", result: %{message: "success"})
    else
      conn
      |> put_resp_content_type("application/pdf")
      |> put_resp_header("content-disposition", "inline; filename=#{filename}.pdf")
      |> send_resp(200, content)
    end
  end

  defp return_result(result, json_name, conn) do
    conn
    |> put_status(200)
    |> put_view(PemeView)
    |> render(json_name, result: result)
  end

  ### End of Return result functions ###
end
