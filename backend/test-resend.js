require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: 'Gym SaaS <noreply@resend.dev>', // This is likely the issue
      to: ['test@example.com'], // Replace with an email for testing (Resend free tier requires the registered email)
      subject: 'Test Email',
      html: '<p>Testing Resend API</p>'
    });
    console.log('Success:', data);
  } catch (error) {
    console.error('Error Details:', JSON.stringify(error, null, 2));
    console.error('Error Message:', error.message);
  }
}

testEmail();
