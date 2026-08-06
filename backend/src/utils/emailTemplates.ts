const wrap = (title: string, bodyHtml: string) => `
<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#F8F5F0;color:#2B2620;">
  <p style="letter-spacing:.3em;font-size:11px;text-transform:uppercase;color:#A8823D;margin:0 0 24px;">ELARAA</p>
  <h1 style="font-size:24px;font-weight:500;margin:0 0 20px;">${title}</h1>
  ${bodyHtml}
  <p style="margin-top:40px;font-size:11px;color:#8a8072;">© ${new Date().getFullYear()} ELARAA. All rights reserved.</p>
</div>`;

const buttonHtml = (url: string, label: string) => `
  <a href="${url}" style="display:inline-block;margin:16px 0;padding:14px 28px;background:#17140F;color:#F8F5F0;text-decoration:none;font-size:12px;letter-spacing:.15em;text-transform:uppercase;">${label}</a>`;

export function verifyEmailTemplate(firstName: string, verifyUrl: string) {
  return wrap(
    'Verify your email',
    `<p>Hi ${firstName}, welcome to ELARAA. Please confirm your email address to finish setting up your account.</p>
     ${buttonHtml(verifyUrl, 'Verify Email')}
     <p style="font-size:12px;color:#8a8072;">If the button doesn't work, copy this link: ${verifyUrl}</p>`
  );
}

export function resetPasswordTemplate(firstName: string, resetUrl: string) {
  return wrap(
    'Reset your password',
    `<p>Hi ${firstName}, we received a request to reset your ELARAA account password. This link expires in 1 hour.</p>
     ${buttonHtml(resetUrl, 'Reset Password')}
     <p style="font-size:12px;color:#8a8072;">If you didn't request this, you can safely ignore this email.</p>`
  );
}

export function orderConfirmationTemplate(
  fullName: string,
  orderNumber: string,
  items: { productName: string; variantLabel: string; quantity: number; lineTotal: number }[],
  totalAmount: number
) {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:13px;">${i.productName} <span style="color:#8a8072;">(${i.variantLabel}) × ${i.quantity}</span></td>
        <td style="padding:8px 0;font-size:13px;text-align:right;">₹${i.lineTotal.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  return wrap(
    'Order confirmed',
    `<p>Thank you, ${fullName}. Your order <strong>${orderNumber}</strong> has been placed and will be paid on delivery.</p>
     <table style="width:100%;border-collapse:collapse;margin:20px 0;border-top:1px solid rgba(43,38,32,.15);padding-top:12px;">
       ${rows}
       <tr><td style="padding-top:16px;font-weight:bold;">Total</td><td style="padding-top:16px;font-weight:bold;text-align:right;">₹${totalAmount.toLocaleString('en-IN')}</td></tr>
     </table>
     <p style="font-size:12px;color:#8a8072;">We'll email you again once your order ships.</p>`
  );
}
