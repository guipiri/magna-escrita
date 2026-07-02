export function generateMagnificCode(): string {
  const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += baseString.charAt(Math.floor(Math.random() * baseString.length));
  }
  return result;
}
