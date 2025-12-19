/* ===================== IMPORTS ===================== */
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

/* ===================== APP SETUP ===================== */
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ===================== DATABASE ===================== */
mongoose
  .connect(
    "mongodb+srv://anbu:123@cluster0.fvxwu3f.mongodb.net/passkey?appName=Cluster0"
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

/* ===================== TEST ROUTE ===================== */
app.get("/test", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("✅ MongoDB connected");
  } else {
    res.send("❌ MongoDB not connected");
  }
});

/* ===================== SEND MAIL ROUTE ===================== */
app.post("/sendmail", async (req, res) => {
  try {
    const { msg, emaillist } = req.body;

    // Input validation
    if (!msg || !emaillist || !Array.isArray(emaillist) || emaillist.length === 0) {
      return res.status(400).send(false);
    }

    // MongoDB model for credentials
    const Credential = mongoose.model(
      "credential",
      new mongoose.Schema({}, { strict: false }),
      "bulkmail"
    );

    const data = await Credential.find();

    if (!data.length) {
      console.log("❌ No credentials found in DB");
      return res.status(400).send(false);
    }

    const user = data[0].user; // Gmail email
    const pass = data[0].pass; // Gmail App Password

    console.log("📧 Using mail:", user);
    console.log("📨 Sending to:", emaillist.length, "emails");

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // Needed for Render
    });

    // Send emails
    for (const email of emaillist) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "A Message from Bulk Mail App",
        text: msg,
      });
      console.log("✅ Sent to:", email);
    }

    // Success
    res.send(true);
  } catch (error) {
    console.error("❌ Sendmail error:", error.message);
    res.status(500).send(false);
  }
});

/* ===================== START SERVER ===================== */
const PORT = 4000; // You can also use process.env.PORT if you want
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
