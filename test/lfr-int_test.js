require("./util/env.js");

const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");
const config = require("config");

const SESS_SECRET = config.get("app.sess_secret");

const chai = require("chai");
const expect = chai.expect;
const nock = require("nock");
const request = require("supertest");

const app = express();
const router = require("../server");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const lyftService = nock("http://localhost:3000");

let req = request.agent(app);
describe("lfr-ride", function() {
  before(require("mongodb-runner/mocha/before"));
  before(() => {
    return mongoose.connect(config.get("app.dburi")).then(() => {
      app.use(
        session({
          store: new MongoStore({ mongooseConnection: mongoose.connection }),
          secret: SESS_SECRET,
          cookie: { secure: false },
          resave: false,
          saveUninitialized: true
        })
      );
      app.use(router);
    });
  });
  after(() => {
    require("mongodb-runner/mocha/after")();
    mongoose.connection.close();
  });
  describe("basic paths", function() {
    it("should redirect to /index.html", function() {
      return req
        .get("/step1")
        .expect("Location", "/index.html")
        .expect(302);
    });
  });

  describe("authentication", function() {
    it("should redirect to /lyft_auth", function() {
      return req
        .post("/step2")
        .type("form")
        .send({ phone: "+15555558383" })
        .expect("Location", "/lyft_auth")
        .expect(302);
    });
    it("should redirect to the lyft website", function() {
      lyftService
        .post("/lyft_auth", {
          phone: "+15555558383"
        })
        .reply(200, {
          url: "https://lyft.com"
        });
      return req
        .get("/lyft_auth")
        .expect(res => {
          const locationHeader = res.headers.location;
          expect(locationHeader).to.equal("https://lyft.com");
        })
        .expect(302);
    });
    it("it should let the lyft service handle the auth token", function() {
      lyftService
        .post("/step3", {
          state: "state",
          code: "code"
        })
        .reply(200);
      return req
        .get("/step3")
        .query({ code: "code", state: "state" })
        .expect(200);
    });
  });
});
