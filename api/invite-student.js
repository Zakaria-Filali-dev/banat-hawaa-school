import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
        email,
        full_name,
        date_of_birth,
        phone,
        address,
        role = 'student',
        subjects
    } = req.body;

    try {
        console.log('Creating user with email:', email);

        // Create user and send invitation email
        const { data: userData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name,
                role,
            },
            redirectTo: `https://banat-hawaa-school.vercel.app/login`
        });

        if (authError) {
            console.error('Auth error:', authError);
            throw authError;
        }

        console.log('User created:', userData.user.id);

        // Create profile in profiles table
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

        if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
        }

        console.log('Profile created successfully');

        // For students, enroll them in selected subjects
        if (role === 'student' && subjects && subjects.length > 0) {
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name")
                .in("name", subjects);

            if (!subjectError && subjectData) {
                const enrollments = subjectData.map(subject => ({
                    student_id: userData.user.id,
                    subject_id: subject.id,
                }));

                const { error: enrollError } = await supabase
                    .from("student_subjects")
                    .insert(enrollments);

                if (enrollError) {
                    console.error("Enrollment error:", enrollError);
                }
            }
        }

        return res.status(200).json({
            success: true,
            user: userData.user,
            message: `${role} account created successfully and invitation email sent!`
        });
    } catch (err) {
        console.error("Error in invite handler:", err);
        return res.status(500).json({
            error: err.message || "Unknown error",
            details: err
        });
    }
}
