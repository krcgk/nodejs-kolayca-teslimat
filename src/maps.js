const axios = require("axios");
const config = require("./config");

class RouteCalculator {
  async computeRouteMatrix(origin, destinations) {
    let body = {
      origins: [origin],
      destinations: destinations,
      travelMode: "WALK"
    };

    try {
      let response = await axios.post(
        "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": config.googleMapsApiKey,
            "X-Goog-FieldMask":
              "originIndex,destinationIndex,duration,distanceMeters,status,condition"
          }
        }
      );

      return response.data;
    } catch (err) {
      console.error(err);
      console.log(err.response.data);
    }
  }

  async computeRoute(origin, destination) {
    let body = {
      origin: origin,
      destination: destination,
      travelMode: "WALK",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false
      },
      languageCode: "en-US",
      units: "IMPERIAL"
    };

    let response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.googleMapsApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
        }
      }
    );

    return response.data.routes[0];
  }
}

const routeCalculator = new RouteCalculator();

module.exports = routeCalculator;
