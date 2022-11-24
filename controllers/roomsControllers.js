const mongoose = require("mongoose");

const Room = require("../models/roomModel");
const OpError = require("../helpers/opError");

/* #1 */
exports.createRooms = async (req, res, next) => {
  const reqData = req.body.data;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const rooms = await Room.create(reqData, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      results: rooms.length,
      status: "success",
      data: { rooms },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};

/* #2 */
exports.requestAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find().sort("price.original type");

    res.status(200).json({
      results: rooms.length,
      status: "success",
      data: { rooms },
    });
  } catch (error) {
    next(error);
  }
};

/* #3 */
exports.requestOneRoom = async (req, res, next) => {
  const roomId = req.params.id;

  try {
    const room = await Room.findOne({ _id: roomId });

    if (!room) return next(new OpError(404, `No room found with this id '${roomId}'.`));

    res.status(200).json({
      results: 1,
      status: "success",
      data: { room },
    });
  } catch (error) {
    next(error);
  }
};

/* #4 */
exports.updateOneRoom = async (req, res, next) => {
  const roomId = req.params.id;
  const reqData = req.body.data;

  try {
    /*
    NOTE: We used these methods (`findOne` + `set` + `save`) to update and not `findOneAndUpdate` because the model may have fields with setters and custom validations that uses `this` keyword and inside these functions `this` must be refering to the document being set or being validated.
    When running update validators (e.g. `findOneAndUpdate`) `this` inside setters refers to the query being run and is not defined inside custom validations.
    */
    const room = await Room.findOne({ _id: roomId });

    if (!room) {
      return next(new OpError(404, `No room found with this id '${roomId}'.`));
    }

    room.set(reqData);
    await room.save();

    res.status(200).json({
      results: 1,
      status: "success",
      data: { room },
    });
  } catch (error) {
    next(error);
  }
};

/* #5 */
exports.deleteOneRoom = async (req, res, next) => {
  const roomId = req.params.id;

  try {
    const room = await Room.deleteOne({ _id: roomId });

    if (!room.deletedCount)
      return next(new OpError(404, `No room found with this id '${roomId}'.`));

    res.status(204).json({
      results: 0,
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};
