import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({
                error: 'Missing required fields: to, subject, html'
            });
        }

        // Create Gmail SMTP transporter
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true, // Use SSL
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify SMTP connection
        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        // Send email
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Banat Hawaa School" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Email sent successfully:', info.messageId);

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully via Gmail SMTP'
        });

    } catch (error) {
        console.error('Gmail SMTP test error:', error);

        return res.status(500).json({
            error: 'Failed to send email',
            details: error.message,
            type: error.code || 'UNKNOWN_ERROR'
        });
    }
}