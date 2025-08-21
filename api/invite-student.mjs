import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function inviteStudentHandler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        email,
        full_name,
        date_of_birth,
        phone,
        address,
        role = 'student',
        subjects,
        dev_mode = false  // Add development mode flag
    } = req.body;

    try {
        let userData;

        if (dev_mode) {
            // Development mode: Create user without sending email
            const { data, error: authError } = await supabase.auth.admin.createUser({
                email,
                user_metadata: {
                    full_name,
                    role,
                },
                email_confirm: true  // Auto-confirm email in dev mode
            });
            if (authError) throw authError;
            userData = data;
        } else {
            // Production mode: Create user and send invitation email
            const { data, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
                data: {
                    full_name,
                    role,
                }
                // Let Supabase use the Site URL from dashboard settings
            });
            if (authError) throw authError;
            userData = data;
        }

        // 2. Create profile in profiles table
        const { error: profileError } = await supabase
            .from("profiles")
            .insert([{
                id: userData.user.id,
                email,
                full_name,
                date_of_birth,
                phone,
                address,
                role,
            }]);

        if (profileError) throw profileError;

        // 3. For students, enroll them in selected subjects
        if (role === 'student' && subjects && subjects.length > 0) {
            // Get subject IDs from names
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name")
                .in("name", subjects);

            if (!subjectError && subjectData) {
                // Enroll student in subjects
                const enrollments = subjectData.map(subject => ({
                    student_id: userData.user.id,
                    subject_id: subject.id,
                }));

                const { error: enrollError } = await supabase
                    .from("student_subjects")
                    .insert(enrollments);

                if (enrollError) console.error("Enrollment error:", enrollError);
            }
        }

        return res.status(200).json({
            success: true,
            user: userData.user,
            message: `${role} account created successfully${dev_mode ? ' (dev mode - no email sent)' : ' and invitation email sent!'}`,
            dev_mode
        });
    } catch (err) {
        console.error("Error in invite handler:", err.message || err);
        return res.status(500).json({ error: err.message || "Unknown error" });
    }
}
