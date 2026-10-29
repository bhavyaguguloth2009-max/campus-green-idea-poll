const CATEGORIES = ["Waste", "Energy", "Water", "Green Spaces", "Transport"];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateIdea(req, res, next) {
  const title = cleanText(req.body.title);
  const description = cleanText(req.body.description);
  const author_name = cleanText(req.body.author_name);
  const category = cleanText(req.body.category);

  if (!title || !description || !author_name || !category) {
    return res.status(400).json({ error: "Please complete every required field." });
  }
  if (title.length > 90) return res.status(400).json({ error: "The title must be 90 characters or fewer." });
  if (description.length < 15 || description.length > 700) {
    return res.status(400).json({ error: "The description must be between 15 and 700 characters." });
  }
  if (author_name.length > 50) return res.status(400).json({ error: "The name must be 50 characters or fewer." });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: "Please choose a valid category." });

  req.validatedIdea = { title, description, author_name, category };
  next();
}

module.exports = { validateIdea, CATEGORIES };
