# `lfr-ride`

## Install

1. `npm install`;
1. Make sure the following variables are defined:
```
export SESS_SECRET=<session-secret>
export MONGODB_URI=<mongodb-instance-uri>
export SMS_SERVICE=<sms-service-uri>
export LYFT_RIDE_SERVICE=<lyft-ride-service-uri>
export GMAPS_API_KEY=<gmaps-api-key>
```

### Create an `env.sh` file
Instead of redeclaring all the environment variables each time, you can write all the `export` commands into the `env.sh` file and run:
```
source env.sh
```

## Run

1. `npm start` serves the application on port 3001;
1. `npm run dbg` serves the application in debug mode.

## Prettify code

Before submitting the code run `npm run format`.
