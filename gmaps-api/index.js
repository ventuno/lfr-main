const config = require("config");
const rp = require("request-promise");

const API_KEY = config.get("auth.gmaps.key");
const API_BASE_URL = "https://maps.googleapis.com/maps/api";

const STATUS_CODE = {
  OK: "OK",
  ZERO_RESULTS: "ZERO_RESULTS",
  OVER_DAILY_LIMIT: "OVER_DAILY_LIMIT",
  OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
  REQUEST_DENIED: "REQUEST_DENIED",
  INVALID_REQUEST: "INVALID_REQUEST",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  // Errors below are not sent from the gmaps API
  SERVER_ERROR: "SERVER_ERROR"
};

/**
 * Transform address into coordinates
 *
 * @param {string} address Location to be resolved into coordinates
 * @return {Promise} A promise that will resolve with the geocoded address
 */
async function geocode(address) {
  const options = {
    method: "GET",
    uri: `${API_BASE_URL}/geocode/json`,
    qs: {
      address,
      key: API_KEY
    },
    json: true
  };
  const res = await rp(options).catch(e => {
    throw {
      status: STATUS_CODE.SERVER_ERROR,
      error_message: e.message,
      exception: e
    };
  });

  if (res.status === "OK") {
    return res;
  }
  throw {
    status: res.status,
    error_message: res.error_message
  };
}

module.exports = {
  geocode,
  STATUS_CODE
};
