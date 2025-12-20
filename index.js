/* ===================== IMPORTS ===================== */
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

/* ===================== APP SETUP ===================== */
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ===================== SENDGRID SETUP ===================== */
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ===================== DATABASE CONNECTION ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

/* ===================== SEND MAIL ROUTE ===================== */
app.post("/sendmail", async (req, res) => {
  try {
    const { msg, emaillist } = req.body;

    if (!msg || !Array.isArray(emaillist) || emaillist.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message or email list missing"
      });
    }

    for (const email of emaillist) {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM, // ✅ VERIFIED EMAIL ONLY
        subject: "You got a message from BulkMail App",
        text: msg,
        html: `<p>${msg}</p>`
      });

      console.log("📧 Mail sent to:", email);
    }

    res.json({ success: true });

  } catch (error) {
    console.error(
      "❌ SendGrid error:",
      error.response?.body || error.message
    );

    res.status(500).json({
      success: false,
      message: "Email sending failed"
    });
  }
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
