// API Server for Tutoring School
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import deleteUserHandler from "./delete-user.mjs";
import inviteStudentHandler from "./invite-student.mjs";
import deleteMessageHandler from "./admin-delete-message.mjs";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any localhost origin for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
            return callback(null, true);
        }

        // Add production domains here when needed
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000'
        ];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["POST", "GET", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'DELETE' && req.path.includes('delete-message')) {
        console.log('DELETE message request body:', req.body);
        console.log('DELETE message request headers:', req.headers);
    }
    next();
});

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test endpoint for API connectivity
app.get('/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 3000
    });
});

// API endpoints
app.get("/api/test", (req, res) => {
    console.log("Test endpoint hit!");
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

app.post("/api/invite-student", inviteStudentHandler);
app.post("/api/delete-user", deleteUserHandler);
app.delete("/api/admin/delete-message", deleteMessageHandler);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    console.log('Server will continue running...');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('Server will continue running...');
});

// The backend API should run on a different port (e.g., 3000) than the Vite frontend (5173)
const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});