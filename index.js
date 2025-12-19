const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");


const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ===================== DATABASE ===================== */
mongoose
  .connect("mongodb+srv://anbu:123@cluster0.fvxwu3f.mongodb.net/passkey?appName=Cluster0")
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

    // ✅ INPUT VALIDATION
    if (
      !msg ||
      !emaillist ||
      !Array.isArray(emaillist) ||
      emaillist.length === 0
    ) {
      return res.status(400).send(false);
    }

    // MongoDB Model
    const Credential = mongoose.model(
      "credential",
      new mongoose.Schema({}, { strict: false }),
      "bulkmail"
    );

    const data = await Credential.find();

    if (!data.length) {
      console.log("❌ No email credentials in DB");
      return res.status(400).send(false);
    }

    const user = data[0].user;
    const pass = data[0].pass;

    console.log("📧 Using mail:", user);
    console.log("📨 Sending to:", emaillist.length, "emails");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    // SEND EMAILS
    for (const email of emaillist) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "A Message from Bulk Mail App",
        text: msg,
      });
      console.log("✅ Sent to:", email);
    }

    res.send(true);
  } catch (error) {
    console.error("❌ Sendmail error:", error);
    res.status(500).send(false);
  }
});

/* ===================== SERVER ===================== */
const PORT=4000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

