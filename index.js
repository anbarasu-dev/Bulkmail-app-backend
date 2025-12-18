
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.log("❌ Failed to connect to DB:", err.message));
console.log("MONGO_URI =", process.env.MONGO_URI);


app.get("/test", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("✅ MongoDB connected");
  } else {
    res.send("❌ MongoDB not connected");
  }
});


app.post("/sendmail", async (req, res) => {
  const { msg, emaillist } = req.body;

 
  const Credential = mongoose.model("credential", {}, "bulkmail");

  try {
    const data = await Credential.find();

    if (!data.length) return res.status(400).send("No credentials found");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: data[0].toJSON().user,
        pass: data[0].toJSON().pass,
      },
    });

    for (let i = 0; i < emaillist.length; i++) {
      await transporter.sendMail({
        from: data[0].toJSON().user,
        to: emaillist[i],
        subject: "A Message from Bulk Mail App",
        text: msg,
      });
      console.log("Email sent to:", emaillist[i]);
    }

    res.send(true);
  } catch (error) {
    console.log("Error sending email:", error);
    res.send(false);
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
