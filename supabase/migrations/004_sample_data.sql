-- 📊 Sample Data for Testing
-- Run this after setting up the schema

-- Insert sample subjects
INSERT INTO subjects (name, description, status) VALUES 
    ('Mathematics', 'Algebra, Geometry, Calculus, and Statistics', 'active'),
    ('Physics', 'Mechanics, Thermodynamics, Electromagnetism', 'active'),
    ('Chemistry', 'Organic, Inorganic, and Physical Chemistry', 'active'),
    ('Biology', 'Cell Biology, Genetics, Ecology, Human Biology', 'active'),
    ('English Literature', 'Classic and Modern Literature Analysis', 'active'),
    ('Computer Science', 'Programming, Algorithms, Data Structures', 'active');

-- Insert sample admin user (you'll need to create this user through Supabase Auth first)
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
--     ('your-admin-user-id-here', 'admin@school.com', 'School Administrator', 'admin');

-- Insert sample pending applications
INSERT INTO pending_applications (
    full_name, email, date_of_birth, phone, address,
    subjects, motivation, previous_experience
) VALUES 
    (
        'John Smith', 'john.smith@email.com', '2006-05-15', '555-0101', '123 Main St, City',
        ARRAY['Mathematics', 'Physics'],
        'I want to improve my math and physics skills for university preparation.',
        'I have completed high school mathematics and basic physics.'
    ),
    (
        'Emma Johnson', 'emma.johnson@email.com', '2007-08-22', '555-0201', '456 Oak Ave, City',
        ARRAY['Chemistry', 'Biology'],
        'I am passionate about science and want to pursue a career in medicine.',
        'I have strong grades in science subjects at school.'
    ),
    (
        'Michael Brown', 'michael.brown@email.com', '2005-12-03', '555-0301', '789 Pine St, City',
        ARRAY['Computer Science', 'Mathematics'],
        'I love programming and want to learn more advanced concepts.',
        'I have been coding in Python for 2 years as a hobby.'
    ),
    (
        'Sophia Davis', 'sophia.davis@email.com', '2006-03-18', '555-0401', '321 Elm Dr, City',
        ARRAY['English Literature', 'Biology'],
        'I enjoy reading and analyzing literature, and I am also interested in life sciences.',
        'I have participated in school debate team and science fair.'
    );

-- Insert sample school-wide announcement
INSERT INTO announcements (
    title, content, author_id, target_audience, priority
) VALUES 
    (
        'Welcome to the New Academic Year!',
        'We are excited to welcome all students to our tutoring school. Please check your schedules and contact your teachers if you have any questions.',
        (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
        'all',
        'high'
    );

-- Note: More sample data can be added after users are created through the authentication system
