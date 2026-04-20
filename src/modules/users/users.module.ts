// ─── Repository ──────────────────────────────────────────────────────────────
type User = any;

const db = {
  users: new Map()
};

export class UserRepository {
  findById(id: string): User | null {
    return db.users.get(id) ?? null;
  }

  findByEmail(email: string): User | null {
    return Array.from(db.users.values()).find((u) => u.email === email) ?? null;
  }

  save(user: User): User {
    db.users.set(user.id, user);
    return user;
  }
}

export const userRepository = new UserRepository();

// ─── Service ─────────────────────────────────────────────────────────────────
import { generateToken } from "../../shared/middlewares/auth";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: Omit<User, "passwordHash">;
}

// Simplified hash (in production, use bcrypt)
function simpleHash(password: string): string {
  return Buffer.from(password + "precozap_salt").toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

export class UserService {
  register(input: RegisterInput): AuthResult {
    const existing = userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const user: User = {
      id: db.generateId(),
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      passwordHash: simpleHash(input.password),
      createdAt: new Date().toISOString(),
    };

    userRepository.save(user);

    const token = generateToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  login(input: LoginInput): AuthResult {
    const user = userRepository.findByEmail(input.email.toLowerCase());
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  // Demo login (no password required)
  demoLogin(): AuthResult {
    const demoUser = userRepository.findByEmail("demo@precozap.com");
    if (!demoUser) {
      return this.register({
        name: "Usuário Demo",
        email: "demo@precozap.com",
        password: "demo123",
      });
    }
    const token = generateToken({ userId: demoUser.id, email: demoUser.email });
    const { passwordHash: _, ...safeUser } = demoUser;
    return { token, user: safeUser };
  }

  getProfile(userId: string): Omit<User, "passwordHash"> | null {
    const user = userRepository.findById(userId);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

export const userService = new UserService();

// ─── Controller ──────────────────────────────────────────────────────────────
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { sendSuccess, sendError, sendServerError } from "../../shared/utils/response";

export class UserController {
  register(req: Request, res: Response): void {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        sendError(res, "name, email and password are required");
        return;
      }
      if (password.length < 6) {
        sendError(res, "Password must be at least 6 characters");
        return;
      }
      const result = userService.register({ name, email, password });
      sendSuccess(res, result, undefined, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already registered")) {
        sendError(res, error.message, 409);
        return;
      }
      sendServerError(res, error);
    }
  }

  login(req: Request, res: Response): void {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        sendError(res, "email and password are required");
        return;
      }
      const result = userService.login({ email, password });
      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid credentials")) {
        sendError(res, error.message, 401);
        return;
      }
      sendServerError(res, error);
    }
  }

  demoLogin(_req: Request, res: Response): void {
    try {
      const result = userService.demoLogin();
      sendSuccess(res, result);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  getProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      const profile = userService.getProfile(req.user!.userId);
      if (!profile) {
        sendError(res, "User not found", 404);
        return;
      }
      sendSuccess(res, profile);
    } catch (error) {
      sendServerError(res, error);
    }
  }
}

export const userController = new UserController();

// ─── Routes ──────────────────────────────────────────────────────────────────
import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";

const userRouter = Router();

userRouter.post("/register", userController.register.bind(userController));
userRouter.post("/login", userController.login.bind(userController));
userRouter.post("/demo", userController.demoLogin.bind(userController));
userRouter.get("/profile", requireAuth, userController.getProfile.bind(userController));

export default userRouter;
