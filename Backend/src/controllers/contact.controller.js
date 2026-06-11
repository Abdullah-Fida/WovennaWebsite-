const asyncHandler = require("express-async-handler");
const { sendContactQueryAutoReply } = require("../utils/email.service");

const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Please provide name, email, and message." });
  }

  // Send auto-reply
  await sendContactQueryAutoReply(email, name);

  res.status(200).json({ 
    success: true, 
    message: "Your message has been received. We will get back to you soon." 
  });
});

module.exports = { submitContactForm };
