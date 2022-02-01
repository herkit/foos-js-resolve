import crypto from 'crypto'

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("base64");
}

export default hashPassword