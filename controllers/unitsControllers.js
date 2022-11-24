const mongoose = require("mongoose");

const Unit = require("../models/unitModel");
const Room = require("../models/roomModel");
const OpError = require("../helpers/opError");

/* #1 */
exports.createUnits = async (req, res, next) => {
  const reqData = req.body.data;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const units = await Unit.create(reqData, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      results: units.length,
      status: "success",
      data: { units },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};

/* #2 */
exports.requestAllUnits = async (req, res, next) => {
  try {
    const units = await Unit.find().lean();

    res.status(200).json({
      results: units.length,
      status: "success",
      data: { units },
    });
  } catch (error) {
    next(error);
  }
};

/* #3 */
exports.requestOneUnit = async (req, res, next) => {
  const unitId = req.params.id;

  try {
    const unit = await Unit.findOne({ _id: unitId });

    if (!unit) return next(new OpError(404, `No unit found with this id '${unitId}'.`));

    res.status(200).json({
      results: 1,
      status: "success",
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
};

/* #4 */
exports.updateOneUnit = async (req, res, next) => {
  const unitId = req.params.id;
  const reqData = req.body.data;

  try {
    /*
    NOTE: We used these methods (`findOne` + `set` + `save`) to update and not `findOneAndUpdate` because the model may have fields with setters and custom validations that uses `this` keyword and inside these functions `this` must be refering to the document being set or being validated.
    When running update validators (e.g. `findOneAndUpdate`) `this` inside setters refers to the query being run and is not defined inside custom validations.
    */
    const unit = await Unit.findOne({ _id: unitId });

    if (!unit) {
      return next(new OpError(404, `No unit found with this id '${unitId}'`));
    }

    unit.set(reqData);
    await unit.save();

    res.status(200).json({
      results: 1,
      status: "success",
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
};

/* #5 */
exports.deleteOneUnit = async (req, res, next) => {
  const unitId = req.params.id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const unit = await Unit.findOne({ _id: unitId }, "", { session });

    if (!unit) {
      await session.abortTransaction();
      session.endSession();

      return next(new OpError(404, `No unit found with this id '${unitId}'`));
    }

    if (unit.currentBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();

      return next(
        new OpError(
          400,
          "This unit has active bookings that should be deleted first before deleting the unit."
        )
      );
    }

    await Unit.deleteOne({ _id: unitId }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(204).json({
      results: 0,
      status: "success",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};

/* #6 */
exports.requestAvailableUnits = async (req, res, next) => {
  let { start, end, min, max, view, smoking } = req.query;

  try {
    const targetRooms = await Room.findTargetRooms(min, max, view);
    const availableUnits = await Unit.findAvailableUnits(start, end, smoking, targetRooms, true);

    res.status(200).json({
      results: `rooms: ${targetRooms.length} + units: ${
        Object.values(availableUnits).flat().length
      }`,
      status: "success",
      data: { targetRooms, availableUnits },
    });
  } catch (error) {
    next(error);
  }
};
