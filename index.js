const express = require("express");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
require("dotenv").config();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// --- Multer setup for Excel file upload ---
const upload = multer({ storage: multer.memoryStorage() });

// --- MongoDB setup ---
mongoose
  .connect(process.env.MONGO_URI) // ✅ v7+ no options needed
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Failed to connect to MongoDB:", err.message));

// --- MongoDB Schema for email logs ---
const emailLogSchema = new mongoose.Schema({
  email: String,
  message: String,
  sentAt: { type: Date, default: Date.now },
});

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

// --- Health check ---
app.get("/", (req, res) => res.send("✅ BulkMail Backend is running"));

// --- Send emails ---
app.post("/sendemail", upload.single("file"), async (req, res) => {
  try {
    const msg = req.body.msg?.trim();
    if (!msg || !req.file) {
      return res.json({ success: false, message: "Message or file missing" });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Extract emails
    const emails = sheetData
      .map((row) => Object.values(row)[0]?.toString().trim())
      .filter((email) => email && email.includes("@"));

    if (emails.length === 0) {
      return res.json({ success: false, message: "No valid emails found" });
    }

    console.log("📩 Emails to send:", emails);
    console.log("📩 Message content:", msg);

    // Send emails one by one and log to MongoDB
    for (const email of emails) {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM, // must be verified in SendGrid
        subject: "📧 Bulk Mail App",
        text: msg,
        html: `<p>${msg}</p>`, // ✅ working message
      });

      console.log("✅ Mail sent to:", email);

      // Log email to MongoDB
      await EmailLog.create({ email, message: msg });
    }

    res.json({ success: true, message: "Emails sent and logged successfully" });
  } catch (error) {
    console.error("❌ SendGrid Error:", error.response?.body || error.message);
    res.json({ success: false, message: "Email sending failed" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
