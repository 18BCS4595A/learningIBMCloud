const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("pages/sensordata");
});

router.get("/getsensordata", (req, res) => {
  const data = {
    temperature: [],
    humidity: [],
    day: [],
  };
  req.mydb.db.list({ include_docs: true }, (err, body) => {
    if (!err) {
      var count = 8;
      var top = body.rows.length;
      while (count !== 0) {
        if (body.rows[top]) {
          var time =
            new Date(body.rows[0].doc.timestamp)
              .toDateString()
              .split(" ")
              .splice(0, 2) +
            " " +
            new Date(body.rows[0].doc.timestamp).toLocaleTimeString("en-In");
          data.day.push(time);
          data.humidity.push(body.rows[top].doc.humidity);
          data.temperature.push(body.rows[top].doc.temperature);
        }
        count--;
        top--;
      }
      return res.json({ data: data });
    }
  });
});

module.exports = router;
