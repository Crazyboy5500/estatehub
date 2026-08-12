const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['buyer', 'owner', 'admin'],
      default: 'buyer',
    },
    phone: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    location: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailToken: { type: String, select: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    googleId: { type: String, default: null },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    isBlocked: { type: Boolean, default: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailToken;
  delete user.otp;
  delete user.otpExpires;
  delete user.resetToken;
  delete user.resetTokenExpires;
  return user;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
