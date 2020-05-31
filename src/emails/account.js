const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'b17029@students.iitmandi.ac.in',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'b17029@students.iitmandi.ac.in',
        subject: 'Account cancellation.',
        text: `We have canceled you account ${name}. What could have we done to kept you onboard?`
    })
}
module.exports ={
    sendWelcomeEmail, sendGoodbyeEmail
}
