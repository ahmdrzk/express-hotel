const express = require("express");

const usersControllers = require("../controllers/usersControllers");
const authControllers = require("../controllers/authControllers");

const router = express.Router();

router.post("/signup", usersControllers.createOneUser);
router.post("/signin", usersControllers.authenOneUser);
router.post("/forgotPassword", usersControllers.forgotPassword);
router.patch("/resetPassword/:resetToken", usersControllers.resetPassword);
// router.get("/signout", usersControllers.signout); NOTE: Not used because we are using a stateless authentication method.

router.use(authControllers.protectRoute);

router.patch("/updatePassword", usersControllers.updatePassword);
router
  .route("/:id")
  .get(usersControllers.requestOneUser)
  .patch(usersControllers.updateOneUser)
  .delete(usersControllers.deleteOneUser);

router.use(authControllers.authorize("admin"));

router.get("/", usersControllers.requestAllUsers);

module.exports = router;
