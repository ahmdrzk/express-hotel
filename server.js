const mongoose = require("mongoose");

if (process.env.NODE_ENV !== "production") {
  const dotenv = require("dotenv");
  dotenv.config();
}

process.on("uncaughtException", (err) => {
  console.log("⚠️ uncaughtException.");

  if (process.env.NODE_ENV === "production") {
    console.log(err.name, err.message);
  } else {
    console.log(err);
  }

  process.exit(1);
});

const app = require("./app");

const dbUri = `${process.env.MONGODB_PROTOCOL}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URL}/${process.env.MONGODB_NAME}?${process.env.MONGODB_CONNECTION_OPTIONS}`;

mongoose
  .connect(dbUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => console.log(`Connected to ${connection.connections[0].name} database.`))
  .catch((err) => console.error("Couldn't connect to database.", err));

const server = app.listen(
  process.env.PORT,
  console.log(`Server started and listening to port ${process.env.PORT}.`)
);

process.on("unhandledRejection", (err) => {
  console.log("⚠️ unhandledRejection.");

  if (process.env.NODE_ENV === "production") {
    console.log(err.name, err.message);
  } else {
    console.log(err);
  }

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM Received.");
  server.close(() => {
    console.log("Process terminated.");
  });
});
