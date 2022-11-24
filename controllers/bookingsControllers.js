const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Booking = require("../models/bookingModel");
const Unit = require("../models/unitModel");
const OpError = require("../helpers/opError");

/* #1 */
exports.createCheckoutSession = async (req, res, next) => {
  const reqData = req.body.data;

  try {
    const availableUnits = await Unit.findAvailableUnits(
      reqData.dates.start,
      reqData.dates.end,
      reqData.smoking,
      [{ _id: reqData.room_id }]
    );

    if (!availableUnits.length) {
      return next(new OpError(404, "No units available for the selected room type."));
    }

    const selectedUnit = availableUnits[0];
    const selectedRoomName = `${selectedUnit.room_id._id[0].toUpperCase()}${selectedUnit.room_id._id.slice(
      1
    )}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}?success=true`,
      cancel_url: `${req.protocol}://${req.get("host")}?canceled=true`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: selectedUnit.room_id.price.original * 100,
            product_data: {
              name: selectedRoomName,
              description: `${selectedRoomName} Room`,
              images: [
                `${req.protocol}://${req.get("host")}/images/rooms/${
                  selectedUnit.room_id._id
                }-1.jpg`,
              ],
            },
          },
        },
      ],
      client_reference_id: String(req.authorizedUser._id),
      customer_email: req.authorizedUser.email,
      metadata: {
        start: reqData.dates.start,
        end: reqData.dates.end,
        passport: reqData.passport_number,
        meals: reqData.meals,
        unit_id: selectedUnit._id,
      },
    });

    res.status(201).json({
      results: 1,
      status: "success",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/* #2 */
exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_KEY
    );
  } catch (error) {
    return res.status(400).send(`⚠️ Webhook signature verification failed.\n${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data.object.id;

    const sessionObject = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    req.body.data = {
      guest_id: sessionObject.client_reference_id,
      room_id: sessionObject.line_items.data[0].description.toLowerCase(),
      unit_id: sessionObject.metadata.unit_id,
      meals: sessionObject.metadata.meals,
      passport_number: sessionObject.metadata.passport,
      dates: {
        start: sessionObject.metadata.start,
        end: sessionObject.metadata.end,
      },
      payment: {
        is_paid: sessionObject.payment_status === "paid" ? true : false,
        amount: Number(sessionObject.amount_total) / 100,
        method: "online",
      },
    };

    next();
  } else {
    return res.status(400).send(`'${event.type}' event has no handlers.`);
  }
};

/* #3 */
exports.createOneBooking = async (req, res, next) => {
  // TODO: Check unit availability if the route is being hit directly from an admin and not by a webhook.
  const reqData = req.body.data;

  try {
    const booking = await Booking.create([reqData]);

    res.status(201).json({
      results: 0,
      status: "success",
      message: "Booking created successfully.",
      data: booking,
    });
  } catch (error) {
    return next(error);
  }
};

/* #4 */
exports.requestAllBookings = async (req, res, next) => {
  const { status } = req.query;

  try {
    const bookings = await Booking.findByStatus(status);

    res.status(200).json({
      results: bookings.length,
      status: "success",
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

/* #5 */
exports.requestOneBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findOne({ _id: bookingId });

    if (!booking) return next(new OpError(404, `No booking found with this id '${bookingId}'.`));

    res.status(200).json({
      results: 1,
      status: "success",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/* #6 */
exports.updateOneBooking = async (req, res, next) => {
  const bookingId = req.params.id;
  const reqData = req.body.data;
  const allowedFields = ["meals", "passport_number"];

  for (const key in reqData) {
    if (!allowedFields.includes(key)) delete reqData[key];
  }

  try {
    /*
    NOTE: We used these methods (`findOne` + `set` + `save`) to update and not `findOneAndUpdate` because the model may have fields with setters and custom validations that uses `this` keyword and inside these functions `this` must be refering to the document being set or being validated.
    When running update validators (e.g. `findOneAndUpdate`) `this` inside setters refers to the query being run and is not defined inside custom validations.
    */
    const booking = await Booking.findOne({ _id: bookingId });

    if (!booking) {
      return next(new OpError(404, `No booking found with this id '${bookingId}'.`));
    }

    if (booking.status !== "Booked") {
      return next(
        new OpError(401, "Not allowed because this booking is having a status other than 'Booked'.")
      );
    }

    booking.set(reqData);
    await booking.save();

    res.status(200).json({
      results: 1,
      status: "success",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/* #7 */
exports.deleteOneBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.deleteOne({ _id: bookingId });

    if (!booking.deletedCount)
      return next(new OpError(404, `No booking found with this id '${bookingId}'.`));

    res.status(204).json({
      results: 0,
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

/* #8 */
exports.requestAllUserBookings = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (req.authorizedUser.role === "customer" && String(req.authorizedUser._id) !== userId)
      return next(
        new OpError(403, "User role is not authorized to perform this action for a different user.")
      );

    const bookings = await Booking.find({ guest_id: userId });

    res.status(200).json({
      results: bookings.length,
      status: "success",
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};
