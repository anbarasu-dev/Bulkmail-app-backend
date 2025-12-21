const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const XLSX = require("xlsx");
require("dotenv").config();

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Failed to connect to MongoDB:", err.message));

// Multer setup for Excel file upload
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get("/", (req, res) => {
  res.send("✅ BulkMail Backend is running");
});

// Send emails route
app.post("/sendemail", upload.single("file"), async (req, res) => {
  try {
    const { msg } = req.body;

    if (!msg) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Excel file is required" });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Extract and clean emails
    const emails = sheetData
      .map(row => Object.values(row)[0]?.toString().trim())
      .filter(email => email && email.includes("@"));

    if (emails.length === 0) {
      return res.status(400).json({ success: false, message: "No valid emails found" });
    }

    console.log("📩 Valid emails:", emails);
    console.log("📩 Message content:", msg);

    // Send emails one by one
    for (const email of emails) {
      await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM, // must be verified in SendGrid
        subject: "📧 Message from BulkMail App",
        text: msg, // plain text
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                 <h2>Bulk Mail Message</h2>
                 <p>${msg.replace(/\n/g, "<br/>")}</p>
                 <hr/>
                 <small>Sent using BulkMail App</small>
               </div>`
      });

      console.log("✅ Email sent to:", email);
    }

    res.json({ success: true, message: "Emails sent successfully" });

  } catch (error) {
    console.error("❌ SendGrid Error:", error.response?.body || error.message);
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
