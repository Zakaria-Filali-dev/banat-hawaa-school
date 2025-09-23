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

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { userId, userType, userName } = req.body;

    if (!userId || !userType) {
        return res.status(400).json({ error: 'User ID and type are required' });
    }

    try {
        console.log(`Starting complete deletion for ${userType}:`, userId, userName);

        // Get user email for additional cleanup
        const { data: userProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .single();

        const userEmail = userProfile?.email;
        console.log('User email:', userEmail);

        // Delete based on user type
        if (userType === 'student') {
            console.log('Deleting student-specific data...');

            // Delete submission files first
            const { data: submissions } = await supabase
                .from("assignment_submissions")
                .select("id")
                .eq("student_id", userId);

            if (submissions) {
                for (const submission of submissions) {
                    await supabase
                        .from("submission_files")
                        .delete()
                        .eq("submission_id", submission.id);
                }
            }

            // Delete student-specific data
            await supabase.from("assignment_submissions").delete().eq("student_id", userId);
            await supabase.from("student_subjects").delete().eq("student_id", userId);
            await supabase.from("class_attendance").delete().eq("student_id", userId);

        } else if (userType === 'teacher') {
            console.log('Deleting teacher-specific data...');

            // Delete assignment attachments first
            const { data: teacherAssignments } = await supabase
                .from("assignments")
                .select("id")
                .eq("teacher_id", userId);

            if (teacherAssignments) {
                // Delete assignment attachments
                for (const assignment of teacherAssignments) {
                    await supabase
                        .from("assignment_attachments")
                        .delete()
                        .eq("assignment_id", assignment.id);

                    // Delete storage files
                    await supabase.storage
                        .from("assignment-files")
                        .remove([`${assignment.id}/`]);
                }

                // Delete all submissions for teacher's assignments
                await supabase
                    .from("assignment_submissions")
                    .delete()
                    .in("assignment_id", teacherAssignments.map((a) => a.id));
            }

            // CRITICAL: Delete teacher-subject relationships (this was missing!)
            console.log('Deleting teacher_subjects relationships...');
            await supabase.from("teacher_subjects").delete().eq("teacher_id", userId);

            // Delete teacher-specific data
            await supabase.from("assignments").delete().eq("teacher_id", userId);
            await supabase.from("class_sessions").delete().eq("teacher_id", userId);
        }

        // Delete documents uploaded by this user (for both students and teachers)
        console.log('Deleting documents uploaded by user...');
        await supabase.from("documents").delete().eq("uploaded_by", userId);        // Delete common data for all user types
        await supabase.from("notifications").delete().eq("user_id", userId);

        if (userEmail) {
            await supabase.from("notifications").delete().eq("recipient_email", userEmail);
            await supabase.from("pending_applications").delete().eq("email", userEmail);
        }

        await supabase.from("announcements").delete().eq("author_id", userId);
        await supabase
            .from("admin_messages")
            .delete()
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
        await supabase.from("user_suspensions").delete().eq("user_id", userId);

        // CRITICAL: Delete from Supabase Auth using service role
        console.log('Deleting from Supabase Auth...');
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
            console.error('Auth deletion error:', authError);
            return res.status(500).json({
                error: 'Failed to delete from Supabase Auth: ' + authError.message
            });
        }
        console.log('Successfully deleted from Supabase Auth');

        // Delete profile last
        console.log('Deleting profile...');
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            return res.status(500).json({
                error: 'Failed to delete profile: ' + profileError.message
            });
        }

        console.log(`${userType} deletion completed successfully`);

        return res.status(200).json({
            success: true,
            message: `${userType} ${userName} deleted successfully from all systems`
        });

    } catch (err) {
        console.error('Unexpected error during user deletion:', err);
        return res.status(500).json({
            error: 'Internal server error while deleting user: ' + err.message
        });
    }
}