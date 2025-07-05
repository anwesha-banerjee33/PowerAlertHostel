const mongoose = require('mongoose');

const powerReportSchema = new mongoose.Schema({
  status: String,            // 'off' or 'on'
  timestamp: { type: Date, default: Date.now },
  reportedBy: String
});

module.exports = mongoose.model('PowerReport', powerReportSchema);
