require("dotenv").config();
const _ = require("lodash");
const path = require("path");
const express = require("express");
const fileUpload = require("express-fileupload");
const memorystorage = require("./memory");
const routeCalculator = require("./maps");
const config = require("./config");
const app = express();
const port = config.port;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(fileUpload());
app.use(
  `/${config.uploadFolder}`,
  express.static(path.join(__dirname, "..", `${config.uploadFolder}`))
);

app.get("/", (req, res) => {
  res.json({
    message: "It works!"
  });
});

app.post("/api/login", (req, res) => {
  let user =
    (memorystorage.getItem("users") || []).find((user) => {
      return user.phoneNumber === req.body.phoneNumber;
    }) || null;

  if (!user) {
    res.status(401).json({
      message: "User not found"
    });
  }

  return res.json({
    user
  });
});

app.get("/api/packages", (req, res) => {
  let authorizationToken = (req.headers.authorization || "").split(" ")[1];
  let user =
    (memorystorage.getItem("users") || []).find((user) => {
      return user.token === authorizationToken;
    }) || null;

  if (!user) {
    res.status(401).json({
      message: "You should be authorized to access this endpoint"
    });
  }

  let packages = (memorystorage.getItem("packages") || []).filter((package) => {
    return (
      package.responsibleUserId === user.id ||
      package.responsibleUserId === null
    );
  });

  return res.json({
    packages
  });
});

app.put("/api/packages/show/:packageId/move-to-car", (req, res) => {
  let authorizationToken = (req.headers.authorization || "").split(" ")[1];
  let user =
    (memorystorage.getItem("users") || []).find((user) => {
      return user.token === authorizationToken;
    }) || null;

  if (!user) {
    res.status(401).json({
      message: "You should be authorized to access this endpoint"
    });
  }

  let package = (memorystorage.getItem("packages") || []).find((package) => {
    return (
      (package.responsibleUserId === user.id ||
        package.responsibleUserId === null) &&
      package.id === parseInt(req.params.packageId)
    );
  });

  if (!package) {
    res.status(403).json({
      message: "Package not found"
    });
  }

  if (package.status !== "Bekleniyor") {
    res.status(403).json({
      message: "Package not available for delivery"
    });
  }

  package.status = "Araçta";
  package.responsibleUserId = user.id;

  let packages = memorystorage.getItem("packages") || [];

  let indexOf = packages.findIndex((p) => p.id === package.id);
  packages[indexOf] = package;

  memorystorage.setItem("packages", packages);

  return res.json({
    package: package
  });
});

app.get("/api/route", async (req, res) => {
  let authorizationToken = (req.headers.authorization || "").split(" ")[1];
  let user =
    (memorystorage.getItem("users") || []).find((user) => {
      return user.token === authorizationToken;
    }) || null;

  if (!user) {
    res.status(401).json({
      message: "You should be authorized to access this endpoint"
    });
  }

  let packages = (memorystorage.getItem("packages") || []).filter((package) => {
    return package.responsibleUserId === user.id && package.status === "Araçta";
  });

  let origin = {
    waypoint: {
      location: {
        latLng: {
          latitude: Number(req.query.latitude),
          longitude: Number(req.query.longitude)
        }
      }
    },
    routeModifiers: { avoid_ferries: true }
  };

  let destinations = packages.map((package) => {
    return {
      waypoint: {
        location: {
          latLng: {
            latitude: package.position.latitude,
            longitude: package.position.longitude
          }
        }
      }
    };
  });

  // return res.json({
  //   origin,
  //   destinations
  // });

  let routeMatrix = await routeCalculator.computeRouteMatrix(
    origin,
    destinations
  );

  let matrix = [];

  let requests = [];

  routeMatrix.forEach((route) => {
    matrix.push(destinations[route.destinationIndex]);
  });

  requests.push({
    start: {
      latitude: origin.waypoint.location.latLng.latitude,
      longitude: origin.waypoint.location.latLng.longitude
    },
    end: {
      latitude: matrix[0].waypoint.location.latLng.latitude,
      longitude: matrix[0].waypoint.location.latLng.longitude
    }
  });

  if (matrix.length < 2) {
    return res.json({
      points: []
    });
  }

  for (let i = 1; i < matrix.length; i++) {
    requests.push({
      start: {
        latitude: matrix[i - 1].waypoint.location.latLng.latitude,
        longitude: matrix[i - 1].waypoint.location.latLng.longitude
      },
      end: {
        latitude: matrix[i].waypoint.location.latLng.latitude,
        longitude: matrix[i].waypoint.location.latLng.longitude
      }
    });
  }

  let responses = [];

  for (let i = 0; i < requests.length; i++) {
    let response = await routeCalculator.computeRoute(
      {
        location: {
          latLng: {
            latitude: requests[i].start.latitude,
            longitude: requests[i].start.longitude
          }
        }
      },
      {
        location: {
          latLng: {
            latitude: requests[i].end.latitude,
            longitude: requests[i].end.longitude
          }
        }
      }
    );

    responses.push(response);
  }

  return res.json({
    origin,
    destinations,
    routeMatrix,
    matrix,
    requests,
    responses
  });
});

app.post("/api/packages/show/:packageId/complete", (req, res) => {
  let authorizationToken = (req.headers.authorization || "").split(" ")[1];
  let user =
    (memorystorage.getItem("users") || []).find((user) => {
      return user.token === authorizationToken;
    }) || null;

  if (!user) {
    res.status(401).json({
      message: "You should be authorized to access this endpoint"
    });
  }

  let package = (memorystorage.getItem("packages") || []).find((package) => {
    return (
      package.responsibleUserId === user.id &&
      package.id === parseInt(req.params.packageId)
    );
  });

  if (!package) {
    res.status(403).json({
      message: "Package not found"
    });
  }

  if (package.status !== "Araçta") {
    res.status(403).json({
      message: "Package not available for complete"
    });
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(422).json({
      message: "No files were uploaded."
    });
  }

  let photoFile = req.files.photo;
  let photoFileName = `${new Date().getTime()}-${photoFile.name}`;
  let uploadPath = __dirname + "/../uploads/" + photoFileName;

  photoFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).json({
        message: err.message
      });
    } else {
      // photoFileName

      package.status = "Teslim Edildi";
      package.photo = photoFileName;

      let packages = memorystorage.getItem("packages") || [];

      let indexOf = packages.findIndex((p) => p.id === package.id);
      packages[indexOf] = package;

      memorystorage.setItem("packages", packages);

      return res.json({
        package: package
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
