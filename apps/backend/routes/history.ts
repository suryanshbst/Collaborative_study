import { Router } from "express";
import { prisma } from "@repo/db/prisma";
import { historyCreateSchema } from "@repo/zod/zod";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// Protect all history routes
router.use(authMiddleware);

// GET /api/history - Get user's study session history
router.get("/", async (req: AuthRequest, res) => {
  const history = await prisma.history.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ history });
});

// POST /api/history - Save a completed study session
router.post("/", async (req: AuthRequest, res) => {
  const result = historyCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message || "Invalid input" });
    return;
  }

  const { topic, goal, duration, notes } = result.data;

  const entry = await prisma.history.create({
    data: {
      userId: req.user!.userId,
      topic,
      goal,
      duration,
      notes: notes || null,
    },
  });

  res.status(201).json({
    message: "Study session saved successfully",
    entry,
  });
});

// DELETE /api/history/:id - Delete a study history entry
router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  await prisma.history.deleteMany({
    where: {
      id: id!,
      userId,
    },
  });

  res.json({ message: "History entry deleted successfully" });
});

export default router;
