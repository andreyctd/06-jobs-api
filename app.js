require('dotenv').config();
require('express-async-errors');

// extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

// Swagger
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const express = require('express');
const app = express();

const connectDB = require("./db/connect");
const authenticateUser = require("./middleware/authentication");
// routers
const authRouter = require("./routes/auth");
const jobsRouter = require("./routes/jobs");
// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

// middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());
// extra packages

// routes
/* app.get('/', (req, res) => {
  res.send('<h1>Jobs API</h1><a href="/api-docs">Documentation</a>');
}); */
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(express.static("public"));

// middleware to fix Content-Type for testing purposes
app.use((req, res, next) => {
  if (req.path === "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobsRouter);

// multiply API (for testing)
app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

/*   app.get("/multiply", (req, res) => {
  const first = Number(req.query.first);
  const second = Number(req.query.second);

  let result = first * second;

  if (isNaN(result)) {
    result = "NaN";
  }

  res.json({ result });
});   */

/*   app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Jobs App</title></head>
      <body>
        <h1>Jobs Application</h1>
        <p>Click this link to view jobs</p>
      </body>
    </html>
  `);
});   */

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

// for testing, we want to use a different database, so we check the environment variable
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

// connect to the database and start the server
const start = async () => {
  try {
    await connectDB(mongoURL);   // wait for DB connection
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

/*   const start = async () => {
  try {
    await connectDB(mongoURL);
    const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
    return server; // return server instance
  } catch (error) {
    console.log(error);
  }
};   */

/*   const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };   */

// only start server if NOT testing
if (process.env.NODE_ENV !== "test") {
start();
}

// export app for testing
module.exports = { app };
