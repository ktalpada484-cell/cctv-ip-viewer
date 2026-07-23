const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true },
  actionType: { type: String, required: true },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);
