const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Map to store OTPs (In production, consider using a more scalable and secure solution)
const otpMap = new Map();

// Send OTP route
app.post('/send-otp', async (req, res) => {
    const { recipientEmail } = req.body;

    try {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in memory map (In production, consider using a database)
        otpMap.set(recipientEmail, otp);

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: 'Your OTP for Participant Deletion',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP route
app.post('/verify-otp', async (req, res) => {
    const { recipientEmail, enteredOTP } = req.body;

    try {
        // Retrieve stored OTP
        const storedOTP = otpMap.get(recipientEmail);

        console.log(`Verifying OTP for ${recipientEmail}`);
        console.log(`Stored OTP: ${storedOTP}, Entered OTP: ${enteredOTP}`);

        if (!storedOTP) {
            return res.status(400).json({ error: 'OTP not found or expired' });
        }

        // Verify OTP
        if (storedOTP !== enteredOTP) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Clear OTP from memory map after successful verification
        otpMap.delete(recipientEmail);

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
