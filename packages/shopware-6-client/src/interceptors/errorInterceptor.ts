import { AxiosError } from "axios";
import {
  ShopwareError,
  ShopwareApiError,
  ClientApiError
} from "@shopware-pwa/commons/interfaces/errors/ApiError";

/**
 * http status codes thrown by API
 */
const API_ERROR_CODES = [400, 401, 403, 404, 409, 410, 412, 424, 500];

/**
 * @param {ShopwareApiError} error
 */
const extractApiErrorStatusCode = (error: ShopwareApiError): number =>
  error.response.status;

/**
 * Extract error message
 * Keep the original errors[] format if 400 Bad Request for validation purposes.
 * 400 responses always points to the specific field/param/option, thus should be kept entirely.
 *
 * @param {ShopwareApiError} error
 * @returns {(string|ShopwareError[])} single message if statusCode !== 400, array of native errors otherwise
 */
const extractApiErrorMessage = (
  error: ShopwareApiError
): string | ShopwareError[] => {
  const statusCode = extractApiErrorStatusCode(error);
  if (statusCode !== 400) {
    // Only Bad Request response has possibly more than one error object included.
    // Hide callstack in case of 500

    const apiError =
      statusCode === 500
        ? "Internal server error"
        : error.response.data?.errors?.[0].detail;
    return apiError;
  }

  return error.response.data?.errors;
};

/**
 * Extract message from AxiosError which comes from somewhere else.
 * @param {AxiosError} error
 * @returns {string}
 */
const extractNotApiErrorMessage = (error: AxiosError): string => error.message;

/**
 * Extracts and create the consistent error object
 * Error message depends on:
 * 1. type of error (API or other network layer)
 * 2. status code
 *
 * @param {ShopwareApiError} error
 * @returns {Promise<ClientApiError>}
 */
export async function errorInterceptor(
  error: ShopwareApiError
): Promise<ClientApiError> {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error

  const statusCode = extractApiErrorStatusCode(error);

  const clientApiError: ClientApiError = {
    message: API_ERROR_CODES.includes(statusCode)
      ? extractApiErrorMessage(error)
      : extractNotApiErrorMessage(error),
    statusCode: statusCode
  };

  return Promise.reject(clientApiError);
}