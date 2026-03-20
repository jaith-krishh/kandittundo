const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, // set during profile setup
  displayName: { type: String, default: '' },
  avatar: { type: String, default: null }, // base64 string
  profileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
