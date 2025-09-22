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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email } = req.body;

    try {
        console.log('Deleting user with email:', email);

        // Find user by email
        const { data: users, error: findError } = await supabase.auth.admin.listUsers();
        if (findError) throw findError;

        const user = users.users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user role to determine what data to cascade delete
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = profile?.role;
        console.log('User role:', userRole);

        // Cascade delete based on user role
        if (userRole === 'student') {
            // Delete student-specific data
            const { data: submissions } = await supabase
                .from("assignment_submissions")
                .select("id")
                .eq("student_id", user.id);

            if (submissions) {
                for (const submission of submissions) {
                    await supabase
                        .from("submission_files")
                        .delete()
                        .eq("submission_id", submission.id);
                }
            }

            await supabase.from("assignment_submissions").delete().eq("student_id", user.id);
            await supabase.from("student_subjects").delete().eq("student_id", user.id);
            await supabase.from("class_attendance").delete().eq("student_id", user.id);
        } else if (userRole === 'teacher') {
            // Delete teacher-specific data
            const { data: teacherAssignments } = await supabase
                .from("assignments")
                .select("id")
                .eq("teacher_id", user.id);

            if (teacherAssignments) {
                for (const assignment of teacherAssignments) {
                    await supabase.storage
                        .from("assignment-files")
                        .remove([`${assignment.id}/`]);
                }

                await supabase
                    .from("assignment_submissions")
                    .delete()
                    .in("assignment_id", teacherAssignments.map((a) => a.id));
            }

            await supabase.from("assignments").delete().eq("teacher_id", user.id);
            await supabase.from("class_sessions").delete().eq("teacher_id", user.id);
            await supabase.from("teacher_subjects").delete().eq("teacher_id", user.id);
        }

        // Delete common data for all user types
        await supabase
            .from("admin_messages")
            .delete()
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

        await supabase.from("user_suspensions").delete().eq("user_id", user.id);

        // Delete profile
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            throw profileError;
        }

        // Delete from auth (this also removes the user from Supabase Auth)
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) throw authError;

        console.log('User deleted successfully');
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({
            error: err.message || 'Unknown error',
            details: err
        });
    }
}
