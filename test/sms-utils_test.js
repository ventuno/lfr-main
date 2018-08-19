require("./util/env.js");

const chai = require("chai");
const expect = chai.expect;
const nock = require("nock");

const gmapsApi = require("../gmaps-api");
const smsUtils = require("../sms-utils");

const gmaps = nock("https://maps.googleapis.com/maps/api");

/**
 * Mock a successful request to the geocode API
 *
 * @param {string} address The address sent to the API
 * @param {object} location The location object to be returned by the API
 */
function mockSuccesfulGeocodeRequest(address, location) {
  geocodeRequest(address).reply(200, {
    status: gmapsApi.STATUS_CODE.OK,
    results: [location]
  });
}

/**
 * Returns the mock object to which the caller can attach the mocked reply
 *
 * @param {string} address The address sent to the API
 * @return {object} The mocked object to the geocode API
 */
function geocodeRequest(address) {
  return gmaps.get("/geocode/json").query({
    key: "gmaps-api-key",
    address
  });
}

/**
 * Build a test to parse a ride_request message
 *
 * @param {string} message Message of type ride_request
 * @return {function} The test function
 */
function parseRideRequestMessage(message) {
  return async function() {
    const loc = { geometry: { location: { lat: 1, lng: 1 } } };
    mockSuccesfulGeocodeRequest("129 W 81st St New York, NY 10024", loc);
    mockSuccesfulGeocodeRequest("1 1st Avenue, New York, NY 10003", loc);
    const res = await smsUtils.parseMessage(message);
    expect(res).to.deep.equal({
      type: "ride_request",
      params: {
        from: loc,
        to: loc
      }
    });
  };
}

/**
 * Build a test to parse a yes/no message
 *
 * @param {string} type The type of message we are testing (yes or no)
 * @param {string} message Message of type yes
 * @return {function} The test function
 */
function parseParameterLessMessage(type, message) {
  return async function() {
    const res = await smsUtils.parseMessage(message);
    expect(res).to.deep.equal({
      type,
      params: undefined
    });
  };
}

describe("sms-utils", function() {
  afterEach(() => gmaps.cleanAll);
  describe("parseMessage type RIDE_REQUEST", function() {
    it(
      "parse a message of type RIDE_REQUEST",
      parseRideRequestMessage(
        "new ride from: 129 W 81st St New York, NY 10024; to: 1 1st Avenue, New York, NY 10003"
      )
    );
    it(
      "parse a message of type RIDE_REQUEST with extra spaces",
      parseRideRequestMessage(
        "    new ride from  :      129 W 81st St New York, NY 10024;    to:     1 1st Avenue, New York, NY 10003"
      )
    );
    it(
      "parse a message of type RIDE_REQUEST with random capitalization",
      parseRideRequestMessage(
        "New ride from: 129 W 81st St New York, NY 10024; to: 1 1st Avenue, New York, NY 10003"
      )
    );
    it(
      "parse a message of type RIDE_REQUEST with ending period",
      parseRideRequestMessage(
        "new ride from: 129 W 81st St New York, NY 10024; to: 1 1st Avenue, New York, NY 10003."
      )
    );
    it(
      "parse a message of type RIDE_REQUEST with capitalization, spacing and ending period",
      parseRideRequestMessage(
        "New RIDE from   : 129 W 81st St New York, NY 10024    ; TO   : 1 1st Avenue, New York, NY 10003   .    "
      )
    );
    it("fails with type RIDE_REQUEST_ERROR if the geocode API fails", async function() {
      geocodeRequest("129 W 81st St New New York, NY 10024").reply(400);
      geocodeRequest("1 1st Avenue, Shangri La, NY 10003").reply(200, {});
      const message =
        "new ride from: 129 W 81st St New New York, NY 10024; to: 1 1st Avenue, Shangri La, NY 10003";

      try {
        await smsUtils.parseMessage(message);
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).to.deep.equal({
          type: smsUtils.TYPE.RIDE_REQUEST_ERROR.SERVICE_UNAVAILABLE,
          params: undefined
        });
      }
    });
    it("fails with type RIDE_REQUEST_ERROR if the geocode API returns no results", async function() {
      geocodeRequest("129 W 81st St New New York, NY 10024").reply(200, {
        status: gmapsApi.STATUS_CODE.ZERO_RESULTS
      });
      geocodeRequest("1 1st Avenue, Shangri La, NY 10003").reply(200, {
        status: gmapsApi.STATUS_CODE.ZERO_RESULTS
      });
      const message =
        "new ride from: 129 W 81st St New New York, NY 10024; to: 1 1st Avenue, Shangri La, NY 10003";

      try {
        await smsUtils.parseMessage(message);
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).to.deep.equal({
          type: smsUtils.TYPE.RIDE_REQUEST_ERROR.ZERO_RESULTS,
          params: undefined
        });
      }
    });
  });
  describe("parseMessage of type YES", function() {
    it(
      "parse a message of type YES if input=yes",
      parseParameterLessMessage(smsUtils.TYPE.YES, "yes")
    );
    it(
      "parse a message of type YES if input=y",
      parseParameterLessMessage(smsUtils.TYPE.YES, "y")
    );
    it(
      "parse a message of type YES if input=yeah",
      parseParameterLessMessage(smsUtils.TYPE.YES, "yeah")
    );
    it(
      "parse a message of type YES if input=yup",
      parseParameterLessMessage(smsUtils.TYPE.YES, "yup")
    );
    it(
      "parse a message of type YES if input=okp",
      parseParameterLessMessage(smsUtils.TYPE.YES, "okp")
    );
    it(
      "parse a message of type YES if input is capitalized",
      parseParameterLessMessage(smsUtils.TYPE.YES, "Y")
    );
    it(
      "parse a message of type YES if input ends with a period",
      parseParameterLessMessage(smsUtils.TYPE.YES, "Y.")
    );
  });
  describe("parseMessage of type NO", function() {
    it(
      "parse a message of type NO if input=no",
      parseParameterLessMessage(smsUtils.TYPE.NO, "no")
    );
    it(
      "parse a message of type NO if input=n",
      parseParameterLessMessage(smsUtils.TYPE.NO, "n")
    );
    it(
      "parse a message of type NO if input=nope",
      parseParameterLessMessage(smsUtils.TYPE.NO, "nope")
    );
    it(
      "parse a message of type NO if input is capitalized",
      parseParameterLessMessage(smsUtils.TYPE.NO, "N")
    );
    it(
      "parse a message of type NO if input ends with a period",
      parseParameterLessMessage(smsUtils.TYPE.NO, "N.")
    );
  });
  describe("parseMessage of type CANCEL", function() {
    it(
      "parse a message of type CANCEL if input=cancel",
      parseParameterLessMessage(smsUtils.TYPE.CANCEL, "cancel")
    );
    it(
      "parse a message of type CANCEL if input is capitalized",
      parseParameterLessMessage(smsUtils.TYPE.CANCEL, "CANCEL")
    );
  });
  describe("parseMessage of type UNKNOWN", function() {
    const unknownInputs = [
      "NOOOOOOPE",
      "yessaaa",
      "whatever",
      "new ride from 129 W 81st St New York, NY 10024; to: 1 1st Avenue, New York, NY 10003",
      "new ride from: 129 W 81st St New York, NY 10024 to: 1 1st Avenue, New York, NY 10003",
      "new ride from: 129 W 81st St New York, NY 10024; to 1 1st Avenue, New York, NY 10003"
    ];
    unknownInputs.forEach(unknownInput =>
      it(
        `message ${unknownInput} is parsed as UNKNOWN`,
        parseParameterLessMessage(smsUtils.TYPE.UNKNOWN, unknownInput)
      )
    );
  });
});
