const express = require("express");
const { supabase } = require("../supabase");
const { validateIdea } = require("../middleware/validate");

const router = express.Router();

function databaseUnavailable(res) {
  return res.status(503).json({ error: "The database is not configured or is temporarily unavailable. Check backend/.env and your Supabase project." });
}

router.get("/", async (req, res, next) => {
  if (!supabase) return databaseUnavailable(res);
  try {
    const { data, error } = await supabase
      .from("ideas")
      .select("id, title, description, category, author_name, vote_count, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ ideas: data || [] });
  } catch (error) { next(error); }
});

router.post("/", validateIdea, async (req, res, next) => {
  if (!supabase) return databaseUnavailable(res);
  try {
    // Public submissions are held for moderator review. The board only lists approved ideas.
    const { data, error } = await supabase
      .from("ideas")
      .insert({ ...req.validatedIdea, status: "pending" })
      .select("id, title, description, category, author_name, vote_count, created_at, status")
      .single();
    if (error) throw error;
    res.status(201).json({
      message: "Thanks! Your idea has been submitted for review before it appears on the board.",
      submission_id: data.id
    });
  } catch (error) { next(error); }
});

router.post("/:id/vote", async (req, res, next) => {
  if (!supabase) return databaseUnavailable(res);
  const id = req.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: "Invalid idea identifier." });
  }
  try {
    // This MVP allows a support action per browser via localStorage. For production,
    // use authenticated voters and enforce one vote per user in PostgreSQL.
    const { data: idea, error: readError } = await supabase
      .from("ideas").select("id, vote_count, status").eq("id", id).eq("status", "approved").maybeSingle();
    if (readError) throw readError;
    if (!idea) return res.status(404).json({ error: "This idea was not found or is not available for voting." });
    const { data, error } = await supabase.rpc("increment_idea_vote", { idea_id: id });
    if (error) throw error;
    res.json({ vote_count: data });
  } catch (error) { next(error); }
});

module.exports = router;
