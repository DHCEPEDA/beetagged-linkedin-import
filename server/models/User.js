const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() { return !this.linkedinId && !this.facebookId; },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
  linkedinToken: {
    type: String,
    select: false
  },
  linkedinConnected: {
    type: Boolean,
    default: false
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookToken: {
    type: String,
    select: false
  },
  facebookConnected: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  // Only hash the password if it exists (social login might not have password)
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'defaultsecret12345',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to return user data without sensitive fields
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.linkedinToken;
  delete user.facebookToken;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
