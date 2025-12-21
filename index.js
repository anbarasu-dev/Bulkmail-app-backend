const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();


const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());


sgMail.setApiKey(process.env.SENDGRID_API_KEY);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) =>
    console.error("❌ MongoDB connection failed:", err.message)
  );


app.get("/", (req, res) => {
  res.send("✅ BulkMail Backend is running");
});


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
        from: process.env.EMAIL_FROM, 
        subject: "📧 Message from BulkMail App",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Bulk Mail Message</h2>
            <p>${msg.replace(/\n/g, "<br/>")}</p>
            <hr/>
            <small>Sent using BulkMail App</small>
          </div>
        `
      });

      console.log("📨 Email sent to:", email);
    }

    res.json({ success: true });

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


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
