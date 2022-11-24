const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const cookieParser = require("cookie-parser"); NOTE: Not used because we are using a stateless authentication method.
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");

const { updateOpSetOptions, schemaSetOptions } = require("./helpers/mongoosePlugins");
const OpError = require("./helpers/opError");
const globalErrorHandler = require("./helpers/globalErrorHandler");

mongoose.plugin(updateOpSetOptions);
mongoose.plugin(schemaSetOptions);

const usersRouter = require("./routers/usersRouter");
const roomsRouter = require("./routers/roomsRouter");
const unitsRouter = require("./routers/unitsRouter");
const bookingsRouter = require("./routers/bookingsRouter");
const bookingsControllers = require("./controllers/bookingsControllers");

const app = express();

// app.enable("trust proxy"); NOTE: Not used because we are using a stateless authentication method.

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: "Too many accounts created from this IP, please try again after an hour.",
});

app.use(cors({ origin: process.env.CLIENT_HOST }));
app.options("*", cors());

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingsControllers.webhookCheckout,
  bookingsControllers.createOneBooking
);

app.use(helmet());
if (process.env.NODE_ENV == "development") app.use(morgan("dev"));
app.use("/api", limiter);
app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true })); NOTE: Not used because the app is not receiving urlencoded forms.
// app.use(cookieParser()); NOTE: Not used because we are using a stateless authentication method.
app.use(hpp());
app.use(mongoSanitize());
app.use(compression());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/rooms", roomsRouter);
app.use("/api/v1/units", unitsRouter);
app.use("/api/v1/bookings", bookingsRouter);

app.all("*", (req, res, next) => {
  next(new OpError(404, `Can't '${req.method}' on '${req.originalUrl}'.`));
});

app.use(globalErrorHandler);

module.exports = app;
