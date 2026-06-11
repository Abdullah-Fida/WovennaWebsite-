const brevo = require('@getbrevo/brevo');

// Configure Brevo API instance
const apiInstance = new brevo.TransactionalEmailsApi();

const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sender = {
  email: process.env.BREVO_SENDER_EMAIL || "wovenaa.2026@gmail.com",
  name: process.env.BREVO_SENDER_NAME || "Woveena",
};

/**
 * Sends an order confirmation email to the user
 */
const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
  try {
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
      console.warn("Brevo API key not set, skipping order confirmation email.");
      return false;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = `Order Confirmation - ${orderDetails.orderId}`;
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h1>Thank you for your order!</h1>
          <p>Hi,</p>
          <p>Your order <strong>${orderDetails.orderId}</strong> has been successfully placed and is now being processed.</p>
          <p><strong>Total Amount:</strong> Rs. ${orderDetails.finalAmount}</p>
          <p>We will notify you once it ships.</p>
          <p>Best regards,<br/>The Woveena Team</p>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: userEmail }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Order confirmation email sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

/**
 * Sends an auto-reply email for contact queries
 */
const sendContactQueryAutoReply = async (userEmail, userName) => {
  try {
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
      console.warn("Brevo API key not set, skipping contact auto-reply email.");
      return false;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = "We received your message!";
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <p>Hi ${userName},</p>
          <p>Thank you for reaching out to us. This is an automated email to confirm that we have received your query.</p>
          <p>Our team will review your message and get back to you as soon as possible.</p>
          <p>Best regards,<br/>The Woveena Team</p>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = [{ email: userEmail, name: userName }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Contact auto-reply email sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending contact auto-reply email:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendContactQueryAutoReply
};
