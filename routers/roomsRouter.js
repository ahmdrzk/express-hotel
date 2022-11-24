const express = require("express");

const roomsControllers = require("../controllers/roomsControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

router.get("/", roomsControllers.requestAllRooms);
router.get("/:id", roomsControllers.requestOneRoom);

router.use(authControllers.protectRoute, authControllers.authorize("admin"));

router.post("/", roomsControllers.createRooms);
router.route("/:id").patch(roomsControllers.updateOneRoom).delete(roomsControllers.deleteOneRoom);

module.exports = router;
