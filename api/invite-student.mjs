import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, role, full_name, phone, address } = req.body;
    // Generate a unique token for password setup
    const token = uuidv4();

    // Save token and user info in your database (pseudo-code, replace with actual DB logic)
    // await db.saveInvitationToken({ email, token, role, ... });

    // Construct setup-password link
    const setupLink = `https://banat-hawaa-school.vercel.app/setup-password?token_hash=${token}`;

    // Send email (pseudo-code, replace with actual email sending logic)
    // await sendEmail({
    //   to: email,
    //   subject: 'Set up your account',
    //   html: `<p>Welcome! Click <a href="${setupLink}">here</a> to set your password and activate your account.</p>`
    // });

    return res.status(200).json({ message: 'Invitation sent', setupLink });
}
