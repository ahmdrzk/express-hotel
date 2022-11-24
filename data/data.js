const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/userModel");
const Room = require("../models/roomModel");
const Unit = require("../models/unitModel");
const Booking = require("../models/bookingModel");

const dbUri = `${process.env.MONGODB_PROTOCOL}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URL}/${process.env.MONGODB_NAME}?${process.env.MONGODB_CONNECTION_OPTIONS}`;

mongoose
  .connect(dbUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => console.log(`Connected to ${connection.connections[0].name} database.`));

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const rooms = JSON.parse(fs.readFileSync(`${__dirname}/rooms.json`));
const units = JSON.parse(fs.readFileSync(`${__dirname}/units.json`));
const bookings = JSON.parse(fs.readFileSync(`${__dirname}/bookings.json`));

const importAll = async () => {
  try {
    await User.create(users);
    await Room.create(rooms);
    await Unit.create(units);
    await Booking.create(bookings);

    console.log("All data were imported successfully.");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const importRequired = async () => {
  try {
    await Room.create(rooms);
    await Unit.create(units);

    console.log("Required data were imported successfully.");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const importData = async (data, model, dataName) => {
  try {
    await model.create(data);

    console.log(`${dataName} data were imported successfully.`);
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const deleteAll = async () => {
  try {
    await User.deleteMany();
    await Room.deleteMany();
    await Unit.deleteMany();
    await Booking.deleteMany();

    console.log("All data were deleted successfully.");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const deleteData = async (model, dataName) => {
  try {
    await model.deleteMany();

    console.log(`${dataName} data were deleted successfully.`);
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

if (process.argv[2] === "--import") {
  switch (process.argv[3]) {
    case "all":
      importAll();
      break;

    case "users":
      importData(users, User, "Users");
      break;

    case "rooms":
      importData(rooms, Room, "Rooms");
      break;

    case "units":
      importData(units, Unit, "Units");
      break;

    case "bookings":
      importData(bookings, Booking, "Bookings");
      break;

    default:
      importRequired();
      break;
  }
}

if (process.argv[2] === "--delete") {
  switch (process.argv[3]) {
    case "all":
      deleteAll();
      break;

    case "users":
      deleteData(User, "Users");
      break;

    case "rooms":
      deleteData(Room, "Rooms");
      break;

    case "units":
      deleteData(Unit, "Units");
      break;

    case "bookings":
      deleteData(Booking, "Bookings");
      break;

    default:
      console.log("Specify the collection you want to delete or 'all'.");
      break;
  }
}
