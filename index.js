const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://anbu:123@cluster0.fvxwu3f.mongodb.net/passkey?appName=Cluster0")
  .then(function () {
    console.log("connect to db ✅");
  })
  .catch(function () {
    console.log("Failed to connected to db ❌");
  });


app.post("/sendmail", async function (req, res) {
  const { msg, emaillist } = req.body;

  const credential = mongoose.model("credential", {}, "bulkmail");

  try {
    const data = await credential.find();

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
      console.log("Email sent to: " + emaillist[i]);
    }

    res.send(true); 
  } catch (error) {
    console.log(error);
    res.send(false); 
  }
});

app.listen(4000, function () {
  console.log("server stared");
});