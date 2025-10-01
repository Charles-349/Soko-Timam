import nodemailer from 'nodemailer';

export const sendEmail = async (
    email: string,
    subject: string,
    message: string,
    html: string,
    replyTo?: string 
   
    
) => {
    try {
        const transporter = nodemailer.createTransport({ 
            host: 'smtp.gmail.com', // Gmail SMTP server - smtp in full is simple mail transfer protocol
            port: 465, // SMTP port for Gmail -  is used to send emails
            service: 'gmail', 
            secure: true, // Use SSL for secure connection  - ssl in full is secure socket layer
            auth: { 
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions: nodemailer.SendMailOptions = { 
            from:process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message,
            html: html,
            replyTo: replyTo,
          
        };

        const mailRes = await transporter.sendMail(mailOptions); 
        console.log('mailRes', mailRes);

        if (mailRes.accepted.length > 0) {  
            return 'Email sent successfully';
        } else if (mailRes.rejected.length > 0) {
            return 'Email not sent';
        } else {
            return 'Email server error';
        }
    } catch (error: any) {
        return JSON.stringify(error.message, null, 500);
    }
};