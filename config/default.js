module.exports = {
  app: {
    port: process.env.PORT || 3001,
    dburi: process.env.MONGODB_URI,
    sess_secret: process.env.SESS_SECRET
  },
  auth: {
    gmaps: {
      key: process.env.GMAPS_API_KEY
    }
  },
  services: {
    "sms-service": process.env.SMS_SERVICE,
    "lyft-ride-service": process.env.LYFT_RIDE_SERVICE
  }
};
