import nodemailer from 'nodemailer'

import debugLevels from '@resolve-js/debug-levels'
const log = debugLevels("foosjs:mailer")

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: parseInt(process.env.SMTP_PORT) ?? 465,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    minVersion: 'TLSv1.1',   
    maxVersion: 'TLSv1.2'
  }
});

const sendMail = async (email) => {
  let info = transport.sendMail(email);
  log.debug("Message sent: %s", info.messageId);
  log.debug("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}


export { sendMail }