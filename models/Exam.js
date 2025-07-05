const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  date: { type: String, required: true },      
  time: { type: String, required: true },      
  studentName: { type: String, required: true },
  email: { type: String, required: true }        
});

module.exports = mongoose.model('Exam', ExamSchema);
