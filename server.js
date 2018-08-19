const express = require("express");
const { LyftRide } = require("./model");
const lyftClient = require("./lyft-client");

/* eslint-disable new-cap */
const router = express.Router();

router.get("/step1", (req, res) => {
  res.redirect("/index.html");
});

router.post("/step2", (req, res) => {
  req.session.phone = req.body.phone;
  res.redirect("/lyft_auth");
});

router.get("/step3", (req, res) => {
  return lyftClient
    .handleAuthorizeRedirect(req.query.code, req.query.state)
    .then(() => {
      res.send("Hello World!");
    });
});

router.get("/lyft_auth", async function(req, res) {
  const authUrl = await lyftClient.authorizeUrl(req.session.phone);
  res.redirect(authUrl.url);
});

router.post("/rides", (req, res) => {
  const body = req.body;
  const phone = body.phone;
  return lyftClient
    .requestRide(
      phone,
      lyftClient.RIDE_TYPES.LYFT_LINE,
      body.origin,
      body.destination
    )
    .then(ride => {
      if (ride) {
        return LyftRide.create({
          phone: phone,
          ride_id: ride.ride_id,
          status: ride.status
        });
      }
      throw new Error();
    })
    .then(ride => {
      res.json(ride);
    });
});

module.exports = router;
