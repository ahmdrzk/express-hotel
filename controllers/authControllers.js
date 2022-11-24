const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const OpError = require("../helpers/opError");

/* #1 */
exports.protectRoute = async function (req, res, next) {
  try {
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : // : req.cookies.jwt NOTE: Not used because we are using a stateless authentication method.
        // ? req.cookies.jwt
        null;

    if (!token)
      return next(new OpError(401, "No authentication token is associated with the request."));

    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

    const user = await User.findOne({ _id: decodedToken.id });

    if (!user)
      return next(new OpError(404, "No user is associated with this authentication token."));

    const isPasswordChanged = decodedToken.passwordChangeId === String(user.passwordChange._id);

    if (!isPasswordChanged)
      return next(
        new OpError(
          401,
          "Authentication token is no longer valid because user has changed password."
        )
      );

    req.authorizedUser = user;

    next();
  } catch (error) {
    next(error);
  }
};

/* #2 */
exports.authorize = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.authorizedUser.role))
      return next(new OpError(403, "User role is not authorized to perform this action."));

    next();
  };
};
