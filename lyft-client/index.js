const lyftApi = require("../lyft-api");

/**
 * Retrieve the access token and stores it.
 * @param {string} code Code returned by the API and sent to the redirect URL.
 * @param {string} state The state object as received from the Lyft API.
 * @return {Promise} A promise that will resolve with the user object.
 */
function handleAuthorizeRedirect(code, state) {
  return lyftApi.handleAuthorizeRedirect(code, state);
}

/**
 * Request a new ride.
 * @param {string} phone The phone number identifying the user.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function requestRide(phone, rideType, origin, destination) {
  return lyftApi.requestRide(auth.access_token, rideType, origin, destination);
}

/**
 * Estimate a new ride.
 * @param {string} phone The phone number identifying the user.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the estimate object.
 */
function estimateRide(phone, rideType, origin, destination) {
  return lyftApi.estimateRide(auth.access_token, rideType, origin, destination);
}

module.exports = {
  authorizeUrl(phone) {
    return lyftApi.authorizeUrl(phone);
  },
  handleAuthorizeRedirect,
  requestRide,
  estimateRide,
  RIDE_TYPES: lyftApi.RIDE_TYPES
};
