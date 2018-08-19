require("./util/env.js");

const chai = require("chai");
const expect = chai.expect;
const nock = require("nock");

const gmapsApi = require("../gmaps-api");

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

describe("gmaps-api", () => {
  afterEach(() => gmaps.cleanAll);
  describe("successful state", () => {
    it("should return the results object if the status is OK", async function() {
      const expectedLoc = { geometry: { location: { lat: 1, lng: 1 } } };
      const address = "129 W 81st St New York, NY 10024";
      mockSuccesfulGeocodeRequest(address, expectedLoc);
      const res = await gmapsApi.geocode(address);
      expect(res).to.deep.equal({
        status: gmapsApi.STATUS_CODE.OK,
        results: [expectedLoc]
      });
    });
  });
  describe("fail passing through original API errors", () => {
    const apiErrors = [
      gmapsApi.STATUS_CODE.ZERO_RESULTS,
      gmapsApi.STATUS_CODE.OVER_DAILY_LIMIT,
      gmapsApi.STATUS_CODE.OVER_QUERY_LIMIT,
      gmapsApi.STATUS_CODE.REQUEST_DENIED,
      gmapsApi.STATUS_CODE.INVALID_REQUEST,
      gmapsApi.STATUS_CODE.UNKNOWN_ERROR
    ];
    apiErrors.forEach(apiError => {
      it(`throws with status ${apiError}`, async function() {
        const address = "129 W 81st St New York, NY 10024";
        geocodeRequest(address).reply(200, {
          status: apiError
        });
        try {
          await gmapsApi.geocode(address);
          expect.fail("Should have thrown");
        } catch (e) {
          expect(e).to.deep.equal({
            status: apiError,
            error_message: undefined
          });
        }
      });
    });
  });
  describe("fail with SERVER_ERROR if the HTTP status code is not 200", () => {
    it("throws with status SERVER_ERROR", async function() {
      const address = "129 W 81st St New York, NY 10024";
      geocodeRequest(address).reply(400, {
        status: gmapsApi.STATUS_CODE.SERVER_ERROR
      });
      try {
        await gmapsApi.geocode(address);
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).to.have.property("status", gmapsApi.STATUS_CODE.SERVER_ERROR);
        expect(e).to.have.property(
          "error_message",
          '400 - {"status":"SERVER_ERROR"}'
        );
        expect(e).to.have.property("exception");
      }
    });
  });
});
