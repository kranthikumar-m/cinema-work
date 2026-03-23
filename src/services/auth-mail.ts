interface PasswordResetMailInput {
  email: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: PasswordResetMailInput) {
  console.info(
    `[auth] Password reset requested for ${email}. Hook an email provider into src/services/auth-mail.ts to send this URL: ${resetUrl}`
  );
}
