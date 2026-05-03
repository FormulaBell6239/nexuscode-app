import { Request, Response } from "express";

// Dummy user data for example purposes
const users = [
  { id: 1, username: "user1", email: "user1@example.com", password: "pass123" },
  { id: 2, username: "user2", email: "user2@example.com", password: "pass456" },
];

// Helper to find user by email or username
function findUserByEmailOrUsername(identifier: string) {
  return users.find(
    (u) => u.email === identifier || u.username === identifier
  );
}

// Helper to check password (replace with real hash check in production)
function checkPassword(user: any, password: string) {
  return user.password === password;
}

// Login controller
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: "Missing identifier or password" });
  }
  const user = findUserByEmailOrUsername(identifier);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  if (!checkPassword(user, password)) {
    return res.status(401).json({ error: "Invalid password" });
  }
  // In a real app, generate and return a token/session here
  return res.status(200).json({
    message: "Login successful",
    user: { id: user.id, username: user.username, email: user.email },
  });
};