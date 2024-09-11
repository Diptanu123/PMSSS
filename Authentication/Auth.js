
import express from "express";
import bcrypt from "bcrypt";
import {userData as Student} from "../Database/dbConnection.js"; 

const router = express.Router();

const signup = async (req, res) => {
    try {
        const { studentName, instituteName, studentId, studentPassword, phNumber } = req.body; 
        

        if (!studentPassword) {
            throw new Error("Password is missing from request body");
        }

       const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        if (!salt) {
            throw new Error("Failed to generate salt");
        }

        
        const encryptedPassword = await bcrypt.hash(studentPassword, salt);
        if (!encryptedPassword) {
            throw new Error("Failed to hash password");
        }

        console.log("Request body", req.body);

      
        const newStudent = new Student({
            studentName,
            instituteName,
            studentId,
            studentPassword:encryptedPassword,
            phNumber
        });

        await newStudent.save();

        return res.status(200).json({ status: "ok", student:newStudent });
    } catch (error) {
        res.status(400).json({ error: error.message });
        console.log("Error in signup:", error.message);
    }
};



const login = async (req, res) => {
    try {
        const { studentId,studentPassword } = req.body;

        
        const student = await Student.findOne({ studentId });
        if (student) {
            
            const PasswordMatch = await bcrypt.compare(studentPassword, student.studentPassword);
            if (PasswordMatch) {
                res.json({ status: "ok", student });
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

router.post("/signup", signup);
router.post("/login", login);

export default router;

