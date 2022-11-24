const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const OpError = require("../helpers/opError");
const { sendWelcome, sendPasswordResetUrl } = require("../helpers/sendEmail");

/* #1 */
exports.createOneUser = async (req, res, next) => {
  const { name, email, password, birthdate, country } = req.body.data;

  try {
    const user = (await User.create([{ name, email, password, birthdate, country }]))[0];

    if (user) sendWelcome(user);

    res.status(201).json({
      results: 0,
      status: "success",
      message: "User account created successfully. Please login.",
    });
  } catch (error) {
    next(error);
  }
};

/* #2 */
exports.requestAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      results: users.length,
      status: "success",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

/* #3 */
exports.requestOneUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    if (req.authorizedUser.role === "customer" && String(req.authorizedUser._id) !== userId)
      return next(
        new OpError(403, "User role is not authorized to perform this action for a different user.")
      );

    const user = await User.findOne({ _id: userId });

    if (!user) return next(new OpError(404, `No user found with this id '${userId}'.`));

    res.status(200).json({
      results: 1,
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/* #4 */
exports.updateOneUser = async (req, res, next) => {
  const userId = req.params.id;
  const reqData = req.body.data;
  const allowedFields = ["name", "email", "birthdate", "country"];

  for (const key in reqData) {
    if (!allowedFields.includes(key)) delete reqData[key];
  }

  try {
    if (req.authorizedUser.role === "customer" && String(req.authorizedUser._id) !== userId)
      return next(
        new OpError(403, "User role is not authorized to perform this action for a different user.")
      );

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return next(new OpError(404, `No user found with this id '${userId}'.`));
    }

    user.set(reqData);
    await user.save();

    res.status(200).json({
      results: 1,
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/* #5 */
exports.deleteOneUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    if (req.authorizedUser.role === "customer" && String(req.authorizedUser._id) !== userId)
      return next(
        new OpError(403, "User role is not authorized to perform this action for a different user.")
      );

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return next(new OpError(404, `No user found with this id '${userId}'.`));
    }

    user.set({ is_deactivated: true });
    await user.save();

    // NOTE: Not used because we are using a stateless authentication method.
    // const cookieOptions = {
    //   maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
    //   secure: process.env.NODE_ENV === "production" ? true : false,
    //   httpOnly: true,
    // };
    // res.clearCookie("jwt", cookieOptions);

    res.status(204).json({
      results: 0,
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

/* #6 */
exports.authenOneUser = async (req, res, next) => {
  const { email, password } = req.body.data;

  try {
    if (!email || !password) {
      return next(
        new OpError(400, "Email and Password fields are required for user authentication.")
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.isPasswordValid(password))) {
      return next(new OpError(401, "Incorrect Email or Password."));
    }

    const token = jwt.sign(
      { id: user._id, passwordChangeId: user.passwordChange._id },
      process.env.JWT_PRIVATE_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    user.password = undefined;

    // NOTE: Not used because we are using a stateless authentication method.
    // const cookieOptions = {
    //   maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
    //   httpOnly: true,
    //   secure: req.secure || req.headers("x-forwarded-proto") === "https",
    // };
    // res.cookie("jwt", token, cookieOptions);

    res.status(200).json({
      results: 1,
      status: "success",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* #7 */
exports.updatePassword = async (req, res, next) => {
  const { currentPassword, password } = req.body.data;
  const authUserId = req.authorizedUser._id;

  try {
    const user = await User.findOne({ _id: authUserId }).select("+password");

    if (!user) return next(new OpError(404, `No user found with this id '${authUserId}'.`));

    if (!(await user.isPasswordValid(currentPassword)))
      return next(new OpError(401, "Incorrect current password."));

    user.password = password;
    await user.save();

    // NOTE: Not used because we are using a stateless authentication method.
    // const cookieOptions = {
    //   maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
    //   secure: process.env.NODE_ENV === "production" ? true : false,
    //   httpOnly: true,
    // };
    // res.clearCookie("jwt", cookieOptions);

    res.status(200).json({
      results: 0,
      status: "success",
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
};

/* #8 */
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body.data;

  try {
    const user = await User.findOne({ email });

    if (!user) return next(new OpError(404, `No user found with this email '${email}'.`));

    const passwordResetToken = user.generatePasswordResetToken();
    await user.save();

    const passwordResetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${passwordResetToken}`;

    sendPasswordResetUrl(user, passwordResetUrl);

    res.status(200).json({
      results: 1,
      status: "success",
      message: "Password reset URL is sent to the provided email.",
      data: { passwordResetToken }, // NOTE: Should be received by email only but here we are using a fake SMPT service for sending emails.
    });
  } catch (error) {
    next(error);
  }
};

/* #9 */
exports.resetPassword = async (req, res, next) => {
  const resetToken = req.params.resetToken;
  const { email, password } = req.body.data;

  try {
    const user = await User.findOne({ email });

    if (!user) return next(new OpError(404, `No user found with this email '${email}'.`));

    if (!user.isPasswordResetTokenValid(resetToken))
      return next(new OpError(401, "Password reset token is not valid or has expired."));

    user.resetPassword(password);
    await user.save();

    // NOTE: Not used because we are using a stateless authentication method.
    // const cookieOptions = {
    //   maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
    //   secure: process.env.NODE_ENV === "production" ? true : false,
    //   httpOnly: true,
    // };
    // res.clearCookie("jwt", cookieOptions);

    res.status(200).json({
      results: 0,
      status: "success",
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
};

/* #10 */
// NOTE: Not used because we are using a stateless authentication method.
// exports.signout = async (req, res, next) => {
//   const cookieOptions = {
//     maxAge: process.env.JWT_COOKIE_EXPIRES_IN,
//     secure: process.env.NODE_ENV === "production" ? true : false,
//     httpOnly: true,
//   };

//   res.clearCookie("jwt", cookieOptions);

//   res.status(200).json({
//     results: 0,
//     status: "success",
//     message: "User signed out successfully.",
//   });
// };
