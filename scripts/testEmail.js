require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log('FROM:', process.env.EMAIL_FROM);
  console.log('KEY set:', !!process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: 'faresiraqi07@gmail.com',
    subject: 'EgyTravel - Test Email from egytravel.me',
    html: '<div style="background:#0d1b2a;padding:40px;font-family:Arial"><h1 style="color:#f5a623">EgyTravel Test</h1><p style="color:#fff">Your domain egytravel.me is working correctly!</p></div>'
  });

  if (error) {
    console.log('Error:', JSON.stringify(error));
  } else {
    console.log('Success! Message ID:', data.id);
  }
}

test().catch(console.error);
