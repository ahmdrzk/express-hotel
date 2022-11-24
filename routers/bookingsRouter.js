const express = require("express");

const bookingsControllers = require("../controllers/bookingsControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

router.use(authControllers.protectRoute);

router.post("/checkout-session", bookingsControllers.createCheckoutSession);
router.get("/users/:userId", bookingsControllers.requestAllUserBookings);
router
  .route("/:id")
  .get(bookingsControllers.requestOneBooking)
  .patch(bookingsControllers.updateOneBooking)
  .delete(bookingsControllers.deleteOneBooking);

router.use(authControllers.authorize("admin"));

router
  .route("/")
  .get(bookingsControllers.requestAllBookings)
  .post(bookingsControllers.createOneBooking);

module.exports = router;
