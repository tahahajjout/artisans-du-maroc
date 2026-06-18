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
const verifyAdmin = require("../middleware/verifyAdmin");

router.post("/login", adminLogin);
router.get("/clients", verifyAdmin, getAllClients);
router.get("/artisans", verifyAdmin, getAllArtisans);
router.delete("/artisan/:id", verifyAdmin, deleteArtisan);
router.put("/artisan/:id/status", verifyAdmin, updateArtisanStatus);
router.get("/stats", verifyAdmin, getStats);
module.exports = router;
