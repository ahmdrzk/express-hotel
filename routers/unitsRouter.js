const express = require("express");

const unitsControllers = require("../controllers/unitsControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

router.get("/search", unitsControllers.requestAvailableUnits);

router.use(authControllers.protectRoute, authControllers.authorize("admin"));

router.route("/").get(unitsControllers.requestAllUnits).post(unitsControllers.createUnits);
router
  .route("/:id")
  .get(unitsControllers.requestOneUnit)
  .patch(unitsControllers.updateOneUnit)
  .delete(unitsControllers.deleteOneUnit);

module.exports = router;
