const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const passwordChangeSubSchema = new mongoose.Schema(
  {
    /* #8.1 */
    token: String,
    /* #8.2 */
    expires_in: Date,
  },
  { id: false }
);

const userSchema = new mongoose.Schema({
  /* #1 */
  name: {
    type: String,
    required: [true, "Name field is required."],
    trim: true,
    minLength: [5, "Name field has to be more than or equal to 5 characters."],
    maxLength: [40, "Name field has to be less than or equal to 40 characters."],
    match: [/^[^*|":<>[\]{}`\\()';@&$]+$/, "Name field has to contain only letters and spaces."],
  },
  /* #2 */
  email: {
    type: String,
    unique: true,
    required: [true, "Email field is required."],
    trim: true,
    lowercase: true,
    minLength: [5, "Email field has to be more than or equal to 5 characters."],
    maxLength: [40, "Email field has to be less than or equal to 40 characters."],
    validate: {
      validator: validator.isEmail,
      message: "Email field has to be a valid email address.",
    },
  },
  /* #3 */
  password: {
    type: String,
    required: [true, "Password field is required."],
    trim: true,
    minLength: [8, "Password field has to be more than or equal to 8 characters."],
    maxLength: [50, "Password field has to be less than or equal to 50 characters."],
    select: false,
  },
  /* #4 */
  birthdate: {
    type: Date,
    required: [true, "Birthdate field is required."],
    validate: {
      validator: function (value) {
        return new Date() - value >= new Date(504911232000);
      },
      message: "Birthdate field has to be more than or equal to today minus 16 years.",
    },
  },
  /* #5 */
  country: {
    type: String,
    required: [true, "Country field is required."],
    trim: true,
    minLength: [2, "Country field has to be more than or equal to 2 characters."],
    maxLength: [40, "Country field has to be less than or equal to 40 characters."],
    match: [/^[^*|":<>[\]{}`\\()';@&$]+$/, "Country field has to contain only letters and spaces."],
  },
  /* #6 */
  role: {
    type: String,
    required: [true, "Role field is required."],
    enum: {
      values: ["customer", "admin"],
      message: "Available values are: 'customer', 'admin'.",
    },
    default: "customer",
  },
  /* #7 */
  is_deactivated: {
    type: Boolean,
    required: [true, "Is_Deactivated field is required."],
    default: false,
  },
  /* #8 */
  passwordChange: {
    type: passwordChangeSubSchema,
    default: {},
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;

  if (!this.isNew) this.passwordChange._id = mongoose.Types.ObjectId();

  next();
});

userSchema.pre(/^findOne/, function (next) {
  this.find({ is_deactivated: { $ne: true } });

  next();
});

userSchema.methods.isPasswordValid = async function (inputPassword) {
  /*
  `inputPassword`: <String>
  */

  return await bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const passwordResetToken = crypto.randomBytes(32).toString("hex");

  const hashedPasswordResetToken = crypto
    .createHash("sha256")
    .update(passwordResetToken)
    .digest("hex");

  this.passwordChange.token = hashedPasswordResetToken;
  this.passwordChange.expires_in = Date.now() + 10 * 60 * 1000;

  return passwordResetToken;
};

userSchema.methods.isPasswordResetTokenValid = function (resetToken) {
  /*
  `resetToken`: <String>
  */

  const hashedPasswordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  return (
    hashedPasswordResetToken === this.passwordChange.token &&
    this.passwordChange.expires_in > Date.now()
  );
};

userSchema.methods.resetPassword = function (newPassword) {
  /*
  `newPassword`: <String>
  */

  this.password = newPassword;

  this.passwordChange.token = undefined;
  this.passwordChange.expires_in = undefined;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
