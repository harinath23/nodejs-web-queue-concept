import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import Bull, { Job } from "bull";

const app = express();

app.use(bodyParser.json());

const emailQueue = new Bull("email",{
    redis: "Insert redis url Ref Link: https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/windows/",
});

type EmailType = {
    from: string;
    to: string;
    subject: string;
    text: string;
}

const sendNewEmail = async(email: EmailType)=>{
    emailQueue.add({...email});
}

const processEmailQueue = async(job: Job)=>{
    // Use a test account
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure:false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
        tls: {
            rejectUnauthorized:false,
        },
    });
    const { from, to, subject, text} = job.data;

    console.log("sending mail to %s", to);

    let info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: `<strong>${text}</strong>`,
    });

    console.log("Messsage sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

emailQueue.process(processEmailQueue);

app.post("/send-email",async (req, res)=>{
    const {from, to, subject, text }= req.body;

    await sendNewEmail({from, to, subject, text});
   
    console.log("Added to queue");

    res.json({
        message: "Email Sent",
    });
});

app.listen(4300,()=>{
    console.log("server started at http://localhost:4300");
});