import { Router } from "express";
import { login } from "../controllers/authController";

const router = Router();

// POST /api/login
router.post("/login", login);

// You can add more routes, e.g. register, logout, etc.
// router.post("/register", register);

export default router;