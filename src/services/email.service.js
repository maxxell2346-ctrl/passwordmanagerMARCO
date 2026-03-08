const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationCode(email, code) {
  const subject = "Tu código de verificación";
  const ttl = process.env.EMAIL_VERIFY_CODE_TTL_MIN || 10;

  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>Código de verificación</h2>
      <p>Tu código es: <b>${code}</b></p>
      <p>Vence en ${ttl} minutos.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: email,
    subject,
    html,
  });

  if (error) {
    // Para que tu register haga rollback (transacción) si falla el envío
    throw new Error(error.message || "Error enviando email con Resend");
  }

  return data;
}

module.exports = { sendVerificationCode };