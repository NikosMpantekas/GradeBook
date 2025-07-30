const nodemailer = require('nodemailer');
require('dotenv').config();

const testBrevoEmail = async () => {
  console.log('Testing Brevo SMTP configuration...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const testEmail = {
    from: `"GradeBook System" <${process.env.SMTP_FROM_EMAIL || 'mail@gradebook.pro'}>`,
    to: 'nikosmpantekas@gmail.com', // Your email for testing
    subject: '🧪 Brevo SMTP Test - GradeBook System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1976d2;">✅ Brevo SMTP Test Successful!</h2>
        <p>Your GradeBook email system is working correctly with Brevo SMTP.</p>
        <p><strong>Sender:</strong> mail@gradebook.pro</p>
        <p><strong>Service:</strong> Brevo SMTP</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
};

testBrevoEmail();
