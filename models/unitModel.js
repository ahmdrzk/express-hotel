const mongoose = require("mongoose");

const Room = require("./roomModel");
const { isIdInRange, isExistInCollection, isIdStartsWithVal } = require("../helpers/modelsHelpers");
const {
  fromStrToStartDate,
  fromStrToEndDate,
  validateStartDate,
  validateEndDate,
} = require("../helpers/dateHelpers");
const OpError = require("../helpers/opError");

const unitSchema = new mongoose.Schema({
  /* #1 */
  _id: {
    type: String,
    trim: true,
    minLength: [4, "Id field has to be equal to 4 characters."],
    maxLength: [4, "Id field has to be equal to 4 characters."],
    validate: {
      validator: function (value) {
        return isIdInRange(value, 1001, 4012);
      },
      message: "Id field has to be more than or equal to 1001 and less than or equal to 4012.",
    },
  },
  /* #2 */
  room_id: {
    type: String,
    ref: "Room",
    required: [true, "Room_Id field is required."],
    validate: {
      validator: async function (value) {
        return isExistInCollection(value, Room);
      },
      message: "Room_Id doesn't exist in rooms collection.",
    },
    index: true,
  },
  /* #3 */
  floor: {
    type: Number,
    required: [true, "Floor field is required."],
    min: [1, "Floor field has to be more than or equal to 1."],
    max: [4, "Floor field has to be less than or equal to 4."],
    validate: {
      validator: isIdStartsWithVal,
      message: "Floor has to be the same number as the first letter in _id.",
    },
  },
  /* #4 */
  smoking: {
    type: Boolean,
    required: [true, "Smoking field is required."],
    default: false,
    index: true,
  },
});

unitSchema.virtual("currentBookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "unit_id",
  match: { "dates.end": { $gt: new Date() } },
  options: { projection: { "dates.start": 1, "dates.end": 1 } },
});

unitSchema.pre("find", function (next) {
  this.populate({ path: "room_id", select: "price" }).populate("currentBookings");

  next();
});

unitSchema.pre("findOne", function (next) {
  this.populate("room_id").populate("currentBookings");

  next();
});

unitSchema.statics.findAvailableUnits = async function (
  start,
  end,
  smoking,
  targetRooms,
  mappedToRooms
) {
  /*
  `start`: <String>
  `end`: <String>
  `smoking`: <String>
  `targetRooms`: <Array> of room documents
  `mappedToRooms`: <Boolean>
  */

  const startDate = fromStrToStartDate(start);
  const endDate = fromStrToEndDate(end);

  if (!validateStartDate(startDate))
    throw new OpError(
      400,
      "Dates Start field has to be more than or equal to today. Dates Start field has to be less than or equal to today + 180 days."
    );

  if (!validateEndDate(endDate, startDate))
    throw new OpError(
      400,
      "Dates End field has to be more than or equal to Dates Start + 1 day. Dates End field has to be less than or equal to Dates Start + 90 days."
    );

  const filter = { room_id: { $in: [...targetRooms] } };
  if (smoking !== undefined) filter.smoking = smoking;

  const units = await this.find(filter);

  const availableUnits = units.filter((unit) => {
    if (unit.currentBookings.length === 0) return true;

    const hasNoConflictBooking = unit.currentBookings.filter((booking) => {
      return (
        startDate >= booking.dates.end ||
        (startDate < booking.dates.start && endDate <= booking.dates.start)
      );
    }).length;

    return hasNoConflictBooking;
  });

  if (!mappedToRooms) return availableUnits;

  const availableUnitsToRoomMap = {};
  targetRooms.forEach((room) => {
    availableUnitsToRoomMap[room._id] = availableUnits.filter(
      (unit) => String(unit.room_id._id) === room._id
    );
  });

  return availableUnitsToRoomMap;
};

const Unit = mongoose.model("Unit", unitSchema);

module.exports = Unit;
