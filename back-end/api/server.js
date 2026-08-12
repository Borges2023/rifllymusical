// API significa Application Programming Interface
// POST, GET, PUT, DELETE
// CRUD - Create Read Update Delete
// Endpoint
// Middleware

import express from "express";
import cors from "cors";
import { db } from "./connect.js";
import path from "path";
import { createToken, isAdminConfigured, requireAdmin, validPassword } from "./adminAuth.js";

const __dirname = path.resolve();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "3mb" }));

app.get("/api/", (request, response) => {
  response.send("Só vamos trabalhar com os endpoints '/artists' e '/songs'");
});

app.get("/api/artists", async (request, response) => {
  response.send(await db.collection("artists").find({}).toArray());
});

app.get("/api/songs", async (request, response) => {
  response.send(await db.collection("songs").find({}).toArray());
});

const cleanCampaign = (campaign) => ({
  advertiser: String(campaign.advertiser || "").trim(), title: String(campaign.title || "").trim(),
  description: String(campaign.description || "").trim(), link: String(campaign.link || "").trim(),
  imageUrl: String(campaign.imageUrl || ""), startDate: String(campaign.startDate || ""), endDate: String(campaign.endDate || ""),
  placements: Array.isArray(campaign.placements) ? campaign.placements.filter((item) => ["home", "artists", "songs", "song"].includes(item)) : [], active: Boolean(campaign.active),
});
const publicCampaign = (campaign) => campaign && ({ ...campaign, id: String(campaign._id), _id: undefined });

app.post("/api/admin/login", (request, response) => {
  if (!isAdminConfigured()) return response.status(503).json({ error: "Administração não configurada no servidor." });
  if (!validPassword(request.body?.password)) return response.status(401).json({ error: "Senha inválida." });
  response.json({ token: createToken() });
});

app.get("/api/advertising/active", async (request, response) => {
  const placement = request.query.placement;
  const today = new Date().toISOString().slice(0, 10);
  const campaign = await db.collection("advertisingCampaigns").findOne({ active: true, placements: placement, startDate: { $lte: today }, endDate: { $gte: today } }, { sort: { createdAt: -1 } });
  response.json(publicCampaign(campaign) || null);
});

app.post("/api/advertising/:id/:metric", async (request, response) => {
  if (!["impressions", "clicks"].includes(request.params.metric)) return response.status(400).end();
  const { ObjectId } = await import("mongodb");
  try { await db.collection("advertisingCampaigns").updateOne({ _id: new ObjectId(request.params.id) }, { $inc: { [request.params.metric]: 1 } }); } catch { return response.status(400).end(); }
  response.status(204).end();
});

app.get("/api/admin/advertising/campaigns", requireAdmin, async (request, response) => {
  const campaigns = await db.collection("advertisingCampaigns").find({}).sort({ createdAt: -1 }).toArray();
  response.json(campaigns.map(publicCampaign));
});

app.post("/api/admin/advertising/campaigns", requireAdmin, async (request, response) => {
  const campaign = cleanCampaign(request.body);
  if (!campaign.advertiser || !campaign.title || !campaign.link || !campaign.imageUrl || !campaign.startDate || !campaign.endDate || !campaign.placements.length || campaign.endDate < campaign.startDate) return response.status(400).json({ error: "Dados da campanha inválidos." });
  const result = await db.collection("advertisingCampaigns").insertOne({ ...campaign, impressions: 0, clicks: 0, createdAt: new Date() });
  response.status(201).json({ ...campaign, id: String(result.insertedId), impressions: 0, clicks: 0 });
});

app.use(express.static(path.join(__dirname, "../front-end/dist")));

app.get("*", async (request, response) => {
  response.sendFile(path.join(__dirname, "../front-end/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor está escutando na porta ${PORT}`);
});
