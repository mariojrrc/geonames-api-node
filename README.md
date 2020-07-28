GeoNames API Node/MongoDB Example
=================================================

[![Build Status](https://semaphoreci.com/api/v1/mariojrrc/geonames-api-node/branches/master/badge.svg)](https://semaphoreci.com/mariojrrc/geonames-api-node)

This project is an example of REST API written in Node 12 that makes use of [Koa](https://koajs.com/) framework and [MongoDB](https://mongodb.com/).

It basically has two endpoints that allow us to perform some CRUD operations:

- /v1/state
- /v1/city

The endpoints are protected by a basic authorization header in the following format `Authorization: Basic ....`.
You can use the following value for testing purposes only `Basic NDAxNTU3Y2YtY2Q1OS00MTBlLTlkNTUtOGJhNzk2OTU1ZjVjOmI3ZmZlYjVmZjBhMTQ0NTNmZTcyNWY4Mjc3NTMyODk3ZTQ0MzdhMTQ=`. It is not recommended to have credentials exposed in your code!

Note: By default, the rate limit is 100 requests per second.

## DOCS
The endpoint's documentation is located in `/docs` folder. It was written on top of OpenAPI v3 notation.

## Running the project

**OBS: Node.JS and MongoDB are requeried**

1. Run `npm install`
2. Run `npm run dev`
3. Make calls to the endpoints via [Postman](https://www.getpostman.com/) or similar in the following address `0.0.0.0:3000/v1/state`

**Using it with Docker**
1. `docker build -t mariojrrc/geonames-node .`
2. `docker-compose up`
3. Make calls to the endpoints via [Postman](https://www.getpostman.com/) or similar in the following address `0.0.0.0:8080/v1/state`

## Running tests
1. Run `npm run test`

## Questions and Suggestions?
Drop me an [e-mail](mailto:mariojr.rcosta@gmail.com)

## TODO
- Fetch credentials from database (cached) in order to keep it more easily to maintain
- Create more unit tests to have a 100% coverage score.
