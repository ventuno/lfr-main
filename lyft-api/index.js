const config = require("config");
const rp = require("request-promise");

const API_BASE_URL = config.get("services.lyft-ride-service");
const API_AUTHORIZE_PATH = "lyft_auth";
const API_AUTH_PATH = "step3";
const API_REQUEST_RIDE_PATH = "rides";
const API_ESTIMATE_RIDE_PATH = "estimate";
const RIDE_TYPES = {
  LYFT: "lyft",
  LYFT_PLUS: "lyft_plus",
  LYFT_LINE: "lyft_line",
  LYFT_PREMIER: "lyft_premier",
  LYFT_LUX: "lyft_lux",
  LYFT_LUXSUV: "lyft_luxsuv"
};

/**
 * Retrieve the access token
 * @param {string} code Code returned by the API and sent to the redirect URL.
 * @return {Promise} A promise that will resolve with the auth object.
 */
function authorizeUrl(phone) {
  const body = { phone };
  return doAPIPOST(API_AUTHORIZE_PATH, body);
}

/**
 * Handles the auth URL.
 * @param {string} code
 * @return {Promise} A promise that will resolve with the auth object.
 */
function handleAuthorizeRedirect(code, state) {
  const body = {
    code,
    state
  };
  return doAPIPOST(API_AUTH_PATH, body);
}

/**
 * Request a new ride.
 * @param {string} accessToken The access token.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function requestRide(rideType, origin, destination) {
  const body = {
    ride_type: rideType,
    origin,
    destination
  };
  return doAPIPOST(API_REQUEST_RIDE_PATH, body);
}

/**
 * Estimate a new ride.
 * @param {string} accessToken The access token.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function estimateRide(rideType, origin, destination) {
  const query = {
    ride_type: rideType,
    start_lat: origin.lat,
    start_lng: origin.lng,
    end_lat: destination.lat,
    end_lng: destination.lng
  };
  return doAPIGET(API_ESTIMATE_RIDE_PATH, query);
}

/**
 * Generic API POST request.
 * @param {string} accessToken The access token.
 * @param {string} path The URL path.
 * @param {string} body The data associated with the request.
 * @return {Promise} A promise that will resolve with the response body.
 */
function doAPIPOST(path, body) {
  const options = {
    method: "POST",
    uri: `${API_BASE_URL}/${path}`,
    body: body,
    json: true
  };
  return rp(options).then(body => {
    console.log(body);
    return body;
  });
}

/**
 * Generic API GET request.
 * @param {string} accessToken The access token.
 * @param {string} path The URL path.
 * @param {string} query The data associated with the request.
 * @return {Promise} A promise that will resolve with the response body.
 */
function doAPIGET(accessToken, path, query) {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    uri: `${API_BASE_URL}/${path}`,
    qs: query,
    json: true
  };
  return rp(options).then(body => {
    console.log(body);
    return body;
  });
}

module.exports = {
  authorizeUrl,
  handleAuthorizeRedirect,
  requestRide,
  estimateRide,
  RIDE_TYPES
};
