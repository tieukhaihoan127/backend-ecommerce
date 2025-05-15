const express = require('express');
const path = require("path");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const session = require("express-session");
const moment = require("moment");
const http = require('http');
const { Server } = require("socket.io");
const multer = require("multer");
require("dotenv").config();
const routeAdmin = require("./routes/admin/index.route");
const route = require("./routes/client/index.route");
const database = require("./config/database");
const cors = require('cors');
const indexProductsToElastic = require("./helpers/indexProductsToElastic");
const app = express();
const port = process.env.PORT;
const chatSocket = require("./socket/chat.socket");

const server = http.createServer(app);
const io = new Server(server);
global._io = io;
chatSocket(io);


app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());
const systemConfig = require("./config/system");
const cookieParser = require('cookie-parser');
database.connect();
app.use(cookieParser("JHGJKLKLGFLJK"));


app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.moment = moment;

const checkElasticReady = async () => {
  const elasticClient = require('./config/elasticsearch');
  let connected = false;
  for (let i = 0; i < 10; i++) {
    try {
      const health = await elasticClient.cluster.health({});
      console.log("Elasticsearch is ready:", health.status);
      connected = true;
      break;
    } catch (e) {
      console.log(`Waiting for Elasticsearch... (${i + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s
    }
  }
  if (!connected) {
    console.error("Failed to connect to Elasticsearch");
    process.exit(1);
  }
};

(async () => {
  await checkElasticReady();
  indexProductsToElastic();
})();

routeAdmin(app);
route(app);
// app.get("*", (req, res) => {
//   res.render("client/pages/errors/404", {
//     pageTitle: "404 Not Found",
//   });
// });

server.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`);
});