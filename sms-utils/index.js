const gmapsApi = require("../gmaps-api");

const RIDE_REQUEST = [
  /^\s*new ride from\s*:\s*([A-Z0-9,\s]+)\s*;\s*to\s*:\s*([A-Z0-9,\s]+)\s*\.{0,1}\s*$/i
];
const YES = [
  /^\s*yes\s*\.{0,1}$/i,
  /^\s*y\s*\.{0,1}$/i,
  /^\s*yeah\s*\.{0,1}$/i,
  /^\s*yup\s*\.{0,1}$/i,
  /^\s*okp\s*\.{0,1}$/i
];
const NO = [/^\s*n\s*\.{0,1}$/i, /^\s*nope\s*\.{0,1}$/i, /^\s*no\s*\.{0,1}$/i];
const CANCEL = [/^\s*cancel\s*$/i];

const TYPE = {
  RIDE_REQUEST: "ride_request",
  RIDE_REQUEST_ERROR: {
    ZERO_RESULTS: "zero_results",
    SERVICE_UNAVAILABLE: "service_unavailable"
  },
  YES: "yes",
  NO: "no",
  CANCEL: "cancel",
  UNKNOWN: "unknown"
};

const PARSERS = [
  {
    regex: RIDE_REQUEST,
    fn: parseRideRequest
  },
  {
    regex: YES,
    fn: () => makeMessageObject(TYPE.YES)
  },
  {
    regex: NO,
    fn: () => makeMessageObject(TYPE.NO)
  },
  {
    regex: CANCEL,
    fn: () => makeMessageObject(TYPE.CANCEL)
  }
];

/**
 * Parse a message into its object representation to be
 * understood by a state machine.
 *
 * @param {string} message The message to parse
 * @return {Promise} A promise that will resolve when
 * the message has been parsed.
 */
async function parseMessage(message) {
  for (let i = 0; i < PARSERS.length; i++) {
    const parser = PARSERS[i];
    for (let j = 0; j < parser.regex.length; j++) {
      const match = parser.regex[j].exec(message.trim());
      if (match !== null) {
        return parser.fn(match);
      }
    }
  }
  return makeMessageObject(TYPE.UNKNOWN);
}

/**
 * Parse a message of type RIDE_REQUEST, will resolve
 * the from and to address into geo location
 *
 * @param {array} match the match array
 * @return {Object} An object representing the ride request or an error
 * the message has been parsed.
 */
async function parseRideRequest([, from, to]) {
  const [fromLoc, toLoc] = (await Promise.all([
    gmapsApi.geocode(from.trim()),
    gmapsApi.geocode(to.trim())
  ]).catch(e => {
    switch (e.status) {
      case gmapsApi.STATUS_CODE.ZERO_RESULTS:
        throw makeMessageObject(TYPE.RIDE_REQUEST_ERROR.ZERO_RESULTS);
      default:
        throw makeMessageObject(TYPE.RIDE_REQUEST_ERROR.SERVICE_UNAVAILABLE);
    }
  })).map(loc => loc.results[0]);
  return makeMessageObject(TYPE.RIDE_REQUEST, {
    from: fromLoc,
    to: toLoc
  });
}

/**
 * Builds an object that represent the message
 *
 * @param {string} type The type of message
 * @param {object} params The type-specific parameters
 * @return {Object} An object representation of the message
 */
function makeMessageObject(type, params) {
  return {
    type,
    params
  };
}

module.exports = {
  parseMessage,
  TYPE
};
