const mongoose = require("mongoose");

const { isArrayWithDuplicates } = require("../helpers/modelsHelpers");
const OpError = require("../helpers/opError");

const unitsSubSchema = new mongoose.Schema(
  {
    /* #10.1 */
    list: [
      {
        type: String,
        ref: "Unit",
        unique: true,
        required: [true, "Units List field is required."],
        trim: true,
        minLength: [4, "Units List field has to be equal to 4 characters."],
        maxLength: [4, "Units List field has to be equal to 4 characters."],
      },
    ],
    /* #10.2 */
    size: {
      type: Number,
      default: function () {
        return Number(this.list.length);
      },
    },
  },
  { _id: false, id: false }
);

const roomSchema = new mongoose.Schema({
  /* #1 */
  _id: {
    type: String,
    trim: true,
    minLength: [5, "Id field has to be more than or equal to 5 characters."],
    maxLength: [20, "Id field has to be less than or equal to 20 characters."],
    match: [/^[A-Za-z0-9]+$/, "Id field has to contain only letters and numbers."],
  },
  /* #2 */
  type: {
    type: String,
    unique: true,
    required: [true, "Type field is required."],
    enum: {
      values: [
        "superior",
        "deluxe",
        "premier",
        "signature",
        "signature_plus",
        "signature_panorama",
      ],
      message:
        "Available values are: 'superior', 'deluxe', 'premier', 'signature', 'signature_plus', 'signature_panorama'.",
    },
  },
  /* #3 */
  size_m2: {
    type: Number,
    required: [true, "Size_M2 field is required."],
    min: [35, "Size_M2 field has to be more than or equal to 35."],
    max: [120, "Size_M2 field has to be less than or equal to 120."],
    get: (value) => `${value}m²`,
  },
  /* #4 */
  balcony: {
    type: Boolean,
    required: [true, "Balcony field is required."],
  },
  /* #5 */
  view: {
    type: String,
    required: [true, "View field is required."],
    enum: {
      values: ["pool", "partial_sea", "sea"],
      message: "Available values are: 'pool', 'partial_sea', 'sea'.",
    },
  },
  /* #6 */
  max_guests: {
    type: Number,
    required: [true, "Max_Guests field is required."],
    min: [1, "Max_Guests field has to be more than or equal to 1."],
    max: [4, "Max_Guests field has to be less than or equal to 4."],
  },
  /* #7 */
  facilities: {
    type: [String],
    required: [true, "Facilities field is required."],
    trim: true,
    minLength: [5, "Facilities field has to be more than or equal to 5 characters."],
    maxLength: [100, "Facilities field has to be less than or equal to 100 characters."],
    match: [/^[A-Za-z0-9]+$/, "Id field has to contain only letters and numbers."],
    validate: {
      validator: isArrayWithDuplicates,
      message: "Facilities field has to be an array of unique values.",
    },
  },
  /* #8 */
  images: [
    {
      type: String,
      required: [true, "Images field is required."],
      trim: true,
      minLength: [5, "Images field has to be more than or equal to 5 characters."],
      maxLength: [50, "Images field has to be less than or equal to 50 characters."],
    },
  ],
  /* #9 */
  price: {
    /* #9.1 */
    original: {
      type: Number,
      required: [true, "Price Original field is required."],
      index: true,
    },
    /* #9.2 */
    currency: {
      type: String,
      required: [true, "Price Currency field is required."],
      default: "USD",
      uppercase: true,
      immutable: true,
    },
  },
  /* #10 */
  units: {
    type: unitsSubSchema,
    default: () => ({}),
  },
});

roomSchema.statics.findTargetRooms = async function (min = 0, max, view) {
  /*
  `min`: <String> || <Number>
  `max`: <String> || <Number>
  `view`: <String>
  */

  const priceRange = { $gte: Number(min) };
  if (max) priceRange.$lte = Number(max);

  const filter = { "price.original": priceRange };
  if (view) filter.view = view;

  const targetRooms = await this.find(filter);

  if (!targetRooms.length)
    throw new OpError(404, "No target rooms are available for these options.");

  return targetRooms;
};

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
