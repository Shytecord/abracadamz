const express = require("express");
const http = require("http");
const utils = require("./utils");
const mongoose = require("mongoose");

const config = require("./config.json");
const secrets = require("./secrets.json");

mongoose.connect(`mongodb+srv://${config.mongo.username}:${secrets.mongo.password}@${secrets.mongo.uri}/${config.env}`);

const app = express();
const server = http.createServer(app);

app.use(express.static("www"));
app.use(require("body-parser").json());
app.use(require("cookie-parser")());
app.set("view engine", "ejs");

app.use("/api", require("./routes/api/root"));
app.use("/", require("./routes/public/root"));

server.listen(config.web.port, config.web.host, () => {
    console.log("OK");
});