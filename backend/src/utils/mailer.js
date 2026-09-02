const nodemailer = require('nodemailer');
require('dotenv').config();

// .env dosyasında SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM tanımlıysa
// gerçek e-posta gönderir. Tanımlı değilse, e-postayı konsola yazar (geliştirme/demo modu),
// böylece SMTP bilgisi olmadan da sistem hatasız çalışır.
function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
if (isConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const subject = 'Petlas Saha KB - Şifre Sıfırlama';
  const text = `Şifrenizi sıfırlamak için bu bağlantıya tıklayın (1 saat geçerlidir):\n${resetUrl}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;
  const html = `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`;

  if (!transporter) {
    // SMTP tanımlı değil: demo/geliştirme modu — linki konsola yaz.
    console.log('--------------------------------------------------');
    console.log('[MAIL - SMTP TANIMLI DEĞİL, KONSOL MODU]');
    console.log(`Alıcı: ${toEmail}`);
    console.log(`Konu: ${subject}`);
    console.log(`Sıfırlama linki: ${resetUrl}`);
    console.log('SMTP göndermek için backend/.env dosyasına SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM ekleyin.');
    console.log('--------------------------------------------------');
    return { simulated: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject,
    text,
    html
  });
  return { simulated: false };
}

module.exports = { sendPasswordResetEmail, isConfigured };
