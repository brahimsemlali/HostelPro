// Format: HP-A1B2 (no I, O, 0, 1 to avoid confusion)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateConfirmationCode(): string {
  let code = "HP-";
  for (let i = 0; i < 4; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}
