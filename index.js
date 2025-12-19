/* ===================== IMPORTS ===================== */
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");

/* ===================== APP SETUP ===================== */
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ===================== SENDGRID SETUP ===================== */
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ===================== DATABASE CONNECTION ===================== */
mongoose
  .connect(
    "mongodb+srv://anbu:123@cluster0.fvxwu3f.mongodb.net/passkey?appName=Cluster0"
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/* ===================== TEST ROUTE ===================== */
app.get("/test", (req, res) => {
  res.send("✅ Backend + DB working");
});

/* ===================== SEND MAIL ROUTE ===================== */
app.post("/sendmail", async (req, res) => {
  try {
    const { msg, emaillist } = req.body || {};

    if (!msg || !Array.isArray(emaillist) || emaillist.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input"
      });
    }

    const messages = emaillist.map((email) => ({
      to: email,
      from: "your_verified_sendgrid_email@gmail.com", // MUST be verified
      subject: "You got a message from BulkMail App",
      text: msg
    }));

    await Promise.all(messages.map((m) => sgMail.send(m)));

    console.log("✅ All emails sent via SendGrid");
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
