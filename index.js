// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) =>
    console.error("❌ MongoDB connection failed:", err.message)
  );

// Health check route
app.get("/", (req, res) => {
  res.send("✅ BulkMail Backend is running");
});

// SendMail route
app.post("/sendmail", async (req, res) => {
  try {
    const { msg, emaillist } = req.body;

    if (!msg || !Array.isArray(emaillist) || emaillist.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message or email list missing"
      });
    }

    // Filter invalid emails
    const validEmails = emaillist.filter(
      (email) => typeof email === "string" && email.includes("@")
    );

    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid emails to send"
      });
    }

    console.log("📩 Sending emails to:", validEmails);
    console.log("📩 Message content:", msg);

    
    for (const email of validEmails) {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM, // Must be verified in SendGrid
        subject: "📧 Message from BulkMail App",
        text: msg, // Plain text version
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Bulk Mail Message</h2>
            <p>${msg.replace(/\n/g, "<br/>")}</p>
            <hr/>
            <small>Sent using BulkMail App</small>
          </div>
        `
      });

      console.log("✅ Email sent to:", email);
    }

    res.json({ success: true, message: "Emails sent successfully" });

  } catch (error) {
    console.error(
      "❌ SendGrid Error:",
      error.response?.body || error.message
    );

    res.status(500).json({
      success: false,
      message: "Email sending failed"
    });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
