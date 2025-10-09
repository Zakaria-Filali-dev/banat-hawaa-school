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
        console.log('=== INVITE STUDENT API CALLED ===');
        console.log('Request method:', req.method);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Environment check
        console.log('Environment variables check:');
        console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
        console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase environment variables');
        }

        console.log('Creating user with email:', email, 'role:', role);

        // Validate required fields
        if (!email || !full_name) {
            throw new Error("Email and full name are required");
        }

        // Check if user already exists in auth.users
        console.log('Checking if user already exists with email:', email);
        const { data: existingAuthUsers, error: getUserError } = await supabase.auth.admin.listUsers();

        if (getUserError) {
            console.error('Error checking existing users:', getUserError);
            throw new Error(`Failed to check existing users: ${getUserError.message}`);
        }

        const existingAuthUser = existingAuthUsers.users?.find(user => user.email === email);
        if (existingAuthUser) {
            console.log('User already exists in auth.users:', existingAuthUser.id);
            throw new Error(`A user account with email ${email} already exists. Please use a different email or contact admin.`);
        }

        // Check if profile already exists in profiles table
        const { data: existingProfiles, error: profileCheckError } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("email", email)
            .limit(1);

        if (profileCheckError) {
            console.error('Error checking existing profiles:', profileCheckError);
            throw new Error(`Failed to check existing profiles: ${profileCheckError.message}`);
        }

        if (existingProfiles && existingProfiles.length > 0) {
            console.log('Profile already exists in profiles table:', existingProfiles[0].id);
            throw new Error(`A profile with email ${email} already exists. Please use a different email or contact admin.`);
        }

        // Create user and send invitation email
        console.log('Creating new user with email:', email);
        console.log('Redirect URL:', `https://banat-hawaa-school.vercel.app/setup-password`);

        const { data: userData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name,
                role,
            },
            redirectTo: `https://banat-hawaa-school.vercel.app/auth/callback`
        }); console.log('Supabase invite response - data:', userData);
        console.log('Supabase invite response - error:', authError); if (authError) {
            console.error('Supabase auth error:', authError);
            throw new Error(`Authentication failed: ${authError.message || JSON.stringify(authError)}`);
        }

        if (!userData || !userData.user) {
            throw new Error('No user data returned from Supabase');
        }

        console.log('User created successfully:', userData.user.id);
        console.log('New user email:', userData.user.email);
        console.log('User confirmed:', userData.user.email_confirmed_at !== null);

        // Create profile in profiles table
        console.log('Creating profile in database for user ID:', userData.user.id);
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
            console.error('Profile creation error:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message || JSON.stringify(profileError)}`);
        }

        console.log('Profile created successfully');

        // For students, enroll them in selected subjects
        if (role === 'student' && subjects && subjects.length > 0) {
            console.log('Enrolling student in subjects:', subjects);
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name")
                .in("name", subjects);

            if (subjectError) {
                console.error("Subject lookup error:", subjectError);
                // Don't throw here, just log it
            } else if (subjectData && subjectData.length > 0) {
                const enrollments = subjectData.map(subject => ({
                    student_id: userData.user.id,
                    subject_id: subject.id,
                }));

                const { error: enrollError } = await supabase
                    .from("student_subjects")
                    .insert(enrollments);

                if (enrollError) {
                    console.error("Enrollment error:", enrollError);
                    // Don't throw here, just log it
                }
            }
        }

        // CRITICAL FIX: For teachers, assign them to selected subjects in teacher_subjects table
        if (role === 'teacher' && subjects && subjects.length > 0) {
            console.log('Assigning teacher to subjects:', subjects);
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name")
                .in("name", subjects);

            if (subjectError) {
                console.error("Teacher subject lookup error:", subjectError);
                // Don't throw here, just log it
            } else if (subjectData && subjectData.length > 0) {
                const assignments = subjectData.map(subject => ({
                    teacher_id: userData.user.id,
                    subject_id: subject.id,
                    assigned_at: new Date().toISOString(),
                }));

                const { error: assignError } = await supabase
                    .from("teacher_subjects")
                    .insert(assignments);

                if (assignError) {
                    console.error("Teacher subject assignment error:", assignError);
                    // Don't throw here, just log it
                } else {
                    console.log('Teacher successfully assigned to subjects');
                }
            }
        }

        console.log('=== SUCCESS: User creation completed ===');
        return res.status(200).json({
            success: true,
            user: userData.user,
            message: `${role} account created successfully and invitation email sent!`
        });

    } catch (err) {
        console.error('=== ERROR in invite handler ===');
        console.error('Error type:', typeof err);
        console.error('Error constructor:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Full error object:', err);
        console.error('Error stack:', err.stack);

        // Extract the most useful error message
        let errorMessage = "Unspecified error occurred";

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else if (err && typeof err.message === 'string') {
            errorMessage = err.message;
        } else if (err && typeof err.error === 'string') {
            errorMessage = err.error;
        }

        // Build detailed error response
        const errorResponse = {
            error: errorMessage,
            type: typeof err,
            constructor: err.constructor ? err.constructor.name : 'unknown',
            timestamp: new Date().toISOString(),
            details: {}
        };

        // Add additional error details if available
        if (err.code) errorResponse.details.code = err.code;
        if (err.details) errorResponse.details.supabaseDetails = err.details;
        if (err.hint) errorResponse.details.hint = err.hint;
        if (err.status) errorResponse.details.status = err.status;

        console.error('Sending error response:', errorResponse);

        return res.status(500).json(errorResponse);
    }
}
