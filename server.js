const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB Connected'))
  .catch(err => console.log(' MongoDB Error:', err));


const PowerReport = require('./models/PowerReport');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   
    pass: process.env.EMAIL_PASS    
  }
});


const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});


app.post('/api/report', async (req, res) => {
  const { status, reportedBy } = req.body;

  try {
    const newReport = new PowerReport({ status, reportedBy });
    await newReport.save();

    
    if (status.toLowerCase() === 'off') {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECEIVER_EMAIL,  
        subject: 'Power Alert: Power OFF Reported',
        text: ` Alert: ${reportedBy} has reported a Power OFF situation in the hostel.\n\n Please charge your devices and download necessary materials in advance.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(' Email failed:', error);
        } else {
          console.log(' Email sent:', info.response);
        }
      });
    }

    res.status(200).json({ message: 'Power status reported successfully.' });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Error saving report.' });
  }
});
const Exam = require('./models/Exam');



app.post('/api/exams', async (req, res) => {
  const { subject, date, time, studentName, email } = req.body;
  try {
    const newExam = new Exam({ subject, date, time, studentName, email  });
    await newExam.save();
    res.status(200).json({ message: 'Exam saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving exam.' });
  }
});

app.get('/api/exams', async (req, res) => {
  const { email } = req.query;  

  try {
    let exams = [];
    if (email) {
      exams = await Exam.find({ email });
    }  
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams.' });
  }
});

app.get('/run-cron', async (req, res) => {
  console.log('🔔 /run-cron triggered');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  try {
    const exams = await Exam.find({ date: tomorrowStr });

    if (exams.length === 0) {
      console.log('✅ No exams for tomorrow');
      return res.send('No exams for tomorrow.');
    }

    exams.forEach(exam => {
      const mailOptions = {
        from: `PowerAlertHostel <${process.env.EMAIL_USER}>`,
        to: exam.email,
        subject: `📚 Reminder: Your ${exam.subject} exam is tomorrow!`,
        text: `Hello ${exam.studentName},

📅 Your ${exam.subject} exam is scheduled for ${exam.date} at ${exam.time}.

✅ Please Remember:
- Charge all your devices like laptop, mobile phones, power bank 🔋
- Download necessary PDFs from whatsapp groups, videos from youtube, notes 📝
- Stay calm and focused 😌

Good luck!
PowerAlertHostel`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(' Reminder Email Failed:', error);
        } else {
          console.log(`Reminder Email Sent to ${exam.email}`);
        }
      });
    });

    res.send(`${exams.length} email(s) sent successfully.`);
  } catch (error) {
    console.error('Cron Route Error:', error);
    res.status(500).send('Error running cron job.');
  }
});


// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
