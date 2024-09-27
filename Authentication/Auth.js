import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 
import { userData as Student } from "../Database/dbConnection.js"; 
import dotenv from "dotenv";
import twilio from "twilio"; 
import otpGenerator from "otp-generator"; 

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.SECRET_KEY;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
let currentOTP; 

const signup = async (req, res) => {
    try {
        const { studentName, instituteName, studentId, studentPassword, phNumber } = req.body; 

        if (!studentPassword) {
            throw new Error("Password is missing from request body");
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const encryptedPassword = await bcrypt.hash(studentPassword, salt);

        const newStudent = new Student({
            studentName,
            instituteName,
            studentId,
            studentPassword: encryptedPassword,
            phNumber
        });

        await newStudent.save();

        return res.status(200).json({ status: "ok", student: newStudent });
    } catch (error) {
        res.status(400).json({ error: error.message });
        console.log("Error in signup:", error.message);
    }
};

const login = async (req, res) => {
    try {
        const { studentId, studentPassword } = req.body;

        const student = await Student.findOne({ studentId });
        if (student) {
            const PasswordMatch = await bcrypt.compare(studentPassword, student.studentPassword);
            if (PasswordMatch) {
                const token = jwt.sign({ studentId: student.studentId }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ status: "ok", student, token }); 
            } else {
                return res.json({ status: "Error", getStudent: false, message: "Incorrect password" });
            }
        } else {
            return res.json({ status: "Error", getStudent: false, message: "Student not found" });
        }
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

const sendOTP = async (phoneNumber) => {
    currentOTP = otpGenerator.generate(6, { upperCase: false, specialChars: false }); 

    try {
        await twilioClient.messages.create({
            body: `Your verification code is: ${currentOTP}. Please use this to verify your account`,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });
        return true;
    } catch (error) {
        console.error("Failed to send OTP:", error);
        return false;
    }
};

const verifyOTP = (inputOTP) => {
    return inputOTP === currentOTP;
};

// Endpoint to send OTP
router.post("/send-otp", async (req, res) => {
    const { phoneNumber } = req.body;

    const success = await sendOTP(phoneNumber);
    if (success) {
        return res.json({ status: "ok", message: "OTP sent successfully!" });
    } else {
        return res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Endpoint to verify OTP
router.post("/verify-otp", (req, res) => {
    const { otp } = req.body;

    if (verifyOTP(otp)) {
        return res.json({ status: "ok", message: "OTP verified successfully!" });
    } else {
        return res.status(400).json({ error: "Invalid OTP" });
    }
});

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); 
            }
            req.user = user; 
            next();
        });
    } else {
        res.sendStatus(401); 
    }
};

router.get("/protected", authenticateJWT, (req, res) => {
    res.send("This is a protected route!");
});

router.post("/signup", signup);
router.post("/login", login);

export default router;
