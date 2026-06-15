const express = require("express");
const router = express.Router();
const {
  adminLogin,
  getAllClients,
  getAllArtisans,
  deleteArtisan,
  updateArtisanStatus,
  getStats,
} = require("../controllers/adminController");

router.post("/login", adminLogin);
router.get("/clients", getAllClients);
router.get("/artisans", getAllArtisans);
router.delete("/artisan/:id", deleteArtisan);
router.put("/artisan/:id/status", updateArtisanStatus);
router.get("/stats", getStats);
module.exports = router;
