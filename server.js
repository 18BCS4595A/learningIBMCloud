var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require("body-parser");
var baseroutes = require("./routes/baseroutes");
var sensoroutes = require("./routes/sensoroutes");

// tempelate engine
app.set("view engine", "ejs");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

let mydb, cloudant;
var vendor; // Because the MongoDB and Cloudant use different API commands, we
// have to check which command should be used based on the database
// vendor.
var dbName = "guestbook";

// Separate functions are provided for inserting/retrieving content from
// MongoDB and Cloudant databases. These functions must be prefixed by a
// value that may be assigned to the 'vendor' variable, such as 'mongodb' or
// 'cloudant' (i.e., 'cloudantInsertOne' and 'mongodbInsertOne')

var insertOne = {};

insertOne.cloudant = function (doc, response) {
  mydb.insert(doc, function (err, body, header) {
    if (err) {
      console.log("[mydb.insert] ", err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
};

app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  var doc = { name: userName };
  if (!mydb) {
    console.log("No database.");
    response.send(doc);
    return;
  }
  insertOne[vendor](doc, response);
});

// load local VCAP configuration  and service credentials
function vcapConfiguration() {
  var vcapLocal;
  try {
    vcapLocal = require("./vcap-local.json");
    console.log("Loaded local VCAP", vcapLocal);
  } catch (e) {}

  const appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {};

  const appEnv = cfenv.getAppEnv(appEnvOpts);

  if (
    appEnv.services["cloudantNoSQLDB"] ||
    appEnv.getService(/[Cc][Ll][Oo][Uu][Dd][Aa][Nn][Tt]/)
  ) {
    // Load the Cloudant library.
    var Cloudant = require("@cloudant/cloudant");

    // Initialize database with credentials
    if (appEnv.services["cloudantNoSQLDB"]) {
      // CF service named 'cloudantNoSQLDB'
      cloudant = Cloudant(appEnv.services["cloudantNoSQLDB"][0].credentials);
    } else {
      // user-provided service with 'cloudant' in its name
      cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
    }
  } else if (process.env.CLOUDANT_URL) {
    cloudant = Cloudant(process.env.CLOUDANT_URL);
  }
  return cloudant;
  // if (cloudant) {
  //   //database name
  //   dbName = "guestbook";

  //   // Create a new "mydb" database.
  //   cloudant.db.create(dbName, function (err, data) {
  //     if (!err)
  //       //err if database doesn't already exists
  //       console.log("Created database: " + dbName);
  //   });

  //   // Specify the database we are going to use (mydb)...
  //   mydb = cloudant.db.use(dbName);
  // }
}
cloudant = vcapConfiguration();

//serve static file (index.html, images, css)
app.use(express.static("./public"));

// use guestbook

const guestbook = function (req, res, next) {
  console.log("inside");
  if (cloudant) {
    dbName = "guestbook";
    cloudant.db.create(dbName, (err, data) => {
      if (!err) {
        console.log("Created database: " + dbName);
      }
    });
    mydb = cloudant.db.use(dbName);
    req.mydb = {
      db: mydb,
    };
    next();
  }
};

//  use sensordata
const sensordata = function (req, res, next) {
  if (cloudant) {
    dbName = "sensordata";
    cloudant.db.create(dbName, (err, data) => {
      if (!err) {
        console.log("Created database: " + dbName);
      }
    });
    mydb = cloudant.db.use(dbName);
    req.mydb = {
      db: mydb,
    };
    next();
  }
};

app.use("/", guestbook, baseroutes);

app.use("/sensor", sensordata, sensoroutes);

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(
    "To view your app, open this link in your browser: http://localhost:" + port
  );
});
