const mongoose = require("mongoose");

const User = require("./userModel");
const Room = require("./roomModel");
const Unit = require("./unitModel");
const { isExistInCollection } = require("../helpers/modelsHelpers");
const {
  fromStrToStartDate,
  fromStrToEndDate,
  // validateStartDate, NOTE: No need to use it.
  // validateEndDate,
} = require("../helpers/dateHelpers");

const bookingSchema = new mongoose.Schema({
  /* #1 */
  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Guest_Id field is required."],
    validate: {
      validator: async function (value) {
        return isExistInCollection(value, User);
      },
      message: "Guest_Id doesn't exist in users collection.",
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
      message: "Room_Id doesn't exist in units collection.",
    },
  },
  /* #3 */
  unit_id: {
    type: String,
    ref: "Unit",
    required: [true, "Unit_Id field is required."],
    validate: {
      validator: async function (value) {
        return isExistInCollection(value, Unit);
      },
      message: "Unit_Id doesn't exist in units collection.",
    },
  },
  /* #4 */
  passport_number: {
    type: String,
    required: [true, "Passport_Number field is required."],
    trim: true,
    minLength: [5, "Passport_Number field has to be more than or equal to 5 characters."],
    maxLength: [20, "Passport_Number field has to be less than or equal to 20 characters."],
    match: [/^[A-Za-z0-9]+$/, "Passport_Number field has to contain only letters and numbers."],
  },
  /* #5 */
  meals: {
    type: String,
    required: [true, "Meals field is required."],
    enum: {
      values: ["none", "breakfast", "breakfast_and_lunch", "all_inclusive"],
      message: "Available values are: 'none', 'breakfast', 'breakfast_and_lunch', 'all_inclusive'.",
    },
    default: "none",
  },
  /* #6 */
  dates: {
    /* #6.1 */
    check_in_locale_hr: {
      type: Number,
      required: [true, "Check_In_Locale_Hr field is required."],
      default: 12,
      min: [0, "Check_In_Locale_Hr field has to be more than or equal to 0."],
      max: [23, "Check_In_Locale_Hr field has to be less than or equal to 23."],
      immutable: true,
    },
    /* #6.2 */
    check_out_locale_hr: {
      type: Number,
      required: [true, "Check_Out_Locale_Hr field is required."],
      default: 11,
      min: [0, "Check_Out_Locale_Hr field has to be more than or equal to 0."],
      max: [23, "Check_Out_Locale_Hr field has to be less than or equal to 23."],
      immutable: true,
    },
    /* #6.3 */
    time_zone: {
      type: String,
      required: [true, "Time_Zone field is required."],
      default: "Africa/Cairo",
      trim: true,
      minLength: [5, "Time_Zone field has to be more than or equal to 5 characters."],
      maxLength: [40, "Time_Zone field has to be less than or equal to 40 characters."],
      immutable: true,
    },
    /* #6.4 */
    start: {
      type: Date,
      required: [true, "Dates Start field is required."],
      set: function (value) {
        return fromStrToStartDate(value, +this.dates.check_in_locale_hr);
      },
      // NOTE: No need to use it.
      // validate: {
      //   validator: validateStartDate,
      //   message:
      //     "Dates Start field has to be more than or equal to today. Dates Start field has to be less than or equal to today + 180 days.",
      // },
    },
    /* #6.5 */
    end: {
      type: Date,
      required: [true, "Dates End field is required."],
      set: function (value) {
        return fromStrToEndDate(value, +this.dates.check_out_locale_hr);
      },
      // NOTE: No need to use it.
      // validate: {
      //   validator: function (value) {
      //     return validateEndDate(value, this.dates.start, +this.dates.check_out_locale_hr);
      //   },
      //   message:
      //     "Dates End field has to be more than or equal to Dates Start + 1 day. Dates End field has to be less than or equal to Dates Start + 90 days.",
      // },
    },
  },
  /* #7 */
  payment: {
    /* #7.1 */
    is_paid: {
      type: Boolean,
      required: [true, "Payment Is_Paid field is required."],
    },
    /* #7.2 */
    amount: {
      type: Number,
      required: [true, "Payment Amount field is required."],
      min: 0,
    },
    /* #7.3 */
    currency: {
      type: String,
      required: [true, "Payment Currency field is required."],
      default: "USD",
      uppercase: true,
      immutable: true,
    },
    /* #7.4 */
    method: {
      type: String,
      required: [true, "Payment Method field is required."],
      enum: {
        values: ["at_property", "online"],
        message: "Available values are: 'at_property', 'online'.",
      },
    },
  },
});

bookingSchema.virtual("locale_dates").get(function () {
  return {
    start: this.dates.start.toLocaleString("en-US", {
      timeZone: this.dates.time_zone,
      dateStyle: "full",
      timeStyle: "long",
    }),
    end: this.dates.end.toLocaleString("en-US", {
      timeZone: this.dates.time_zone,
      dateStyle: "full",
      timeStyle: "long",
    }),
  };
});

bookingSchema.virtual("no_of_days").get(function () {
  const startDate = this.dates.start;
  const endDate = this.dates.end;
  const numberOfDays = ((endDate - startDate) / (1000 * 60 * 60 * 24)).toFixed(0);

  return `${numberOfDays} ${+numberOfDays === 1 ? "day" : "days"}`;
});

bookingSchema.virtual("status").get(function () {
  const startDate = this.dates.start;
  const endDate = this.dates.end;
  const now = new Date();

  switch (true) {
    case now < startDate:
      return "Booked";

    case now >= startDate && now < endDate:
      return "In Stay";

    case now >= endDate:
      return "Completed";
  }
});

bookingSchema.pre("/^find/", function (next) {
  this.populate("guest_id").populate("room_id").populate("unit_id");

  next();
});

bookingSchema.statics.findByStatus = async function (status) {
  /*
  `status`: <String>
  */

  const now = new Date();

  let filter = {};

  switch (status) {
    case "booked":
      filter["dates.start"] = { $gt: now };
      break;

    case "in_stay":
      filter["dates.start"] = { $lte: now };
      filter["dates.end"] = { $gt: now };
      break;

    case "completed":
      filter["dates.end"] = { $lte: now };
      break;
  }

  return await Booking.find(filter);
};

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
