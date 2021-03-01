var express = require("express");
var request = require("request");
var router = express.Router();

router.get("/", (req, res) => {
  var data = [];
  var images = [];
  request.get(
    "https://picsum.photos/v2/list?page=2&limit=15",
    (err, response) => {
      images.push(...JSON.parse(response.body));
      req.mydb.db.list({ include_docs: true }, (err, body) => {
        if (!err) {
          body.rows.forEach(function (row) {
            if (row.doc) data.push(row.doc);
          });
          data = data.slice(0, 5);
          return res.render("pages/home", { visitors: data, images: images });
        }
        return res.render("pages/home");
      });
    }
  );
});

router.post("/visitors", (req, res) => {
  const data = req.body;
  console.log(data);
  if (!req.mydb.db) {
    return res.send({ message: "No Db" });
  }
  req.mydb.db.insert(data, (err, body, header) => {
    if (err) {
      return res.redirect("/");
    }
    return res.redirect("/");
  });
});

router.get("/visitors", (req, res) => {
  // const context = getAll();
  const data = [];
  const images = [];
  request.get(
    "https://picsum.photos/v2/list?page=2&limit=15",
    (err, response) => {
      images.push(...JSON.parse(response.body));
      console.log(images[0].id);
      req.mydb.db.list({ include_docs: true }, function (err, body) {
        if (!err) {
          body.rows.forEach(function (row) {
            console.log(row);
            if (row.doc) data.push(row.doc);
          });
          return res.render("pages/visitors", {
            context: data,
            images: images,
          });
        }
        return res.render("pages/visitors", { message: "No Visitors yet" });
      });
    }
  );
});

module.exports = router;
