import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./admin_style.css";

function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [artisanPopup, setArtisanPopup] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [statusPopup, setStatusPopup] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackAvg, setFeedbackAvg] = useState(0);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("adminLoggedIn") || !localStorage.getItem("adminToken")) {
      navigate("/admin/login");
      return;
    }
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/admin/clients`, auth)
      .then((r) => setClients(r.data))
      .catch(handleAuthError);
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/admin/artisans`, auth)
      .then((r) => setArtisans(r.data))
      .catch(handleAuthError);
    axios.get(`${process.env.REACT_APP_API_URL}/api/feedback/all`).then((r) => {
      setFeedbacks(r.data.feedbacks || []);
      setFeedbackAvg(r.data.average || 0);
      setFeedbackTotal(r.data.total || 0);
    });
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/admin/stats`, auth)
      .then((r) => setStats(r.data))
      .catch(handleAuthError);
  }, [navigate]);

  // Draw pie chart when stats load and tab is active
  useEffect(() => {
    if (activeTab !== "stats" || !stats || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const total =
      stats.artisans_actif + stats.artisans_en_attente + stats.artisans_bloque;
    if (total === 0) return;

    const slices = [
      { value: stats.artisans_actif, color: "#27ae60", label: "Actif" },
      {
        value: stats.artisans_en_attente,
        color: "#f39c12",
        label: "En attente",
      },
      { value: stats.artisans_bloque, color: "#e74c3c", label: "Bloqué" },
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let start = -Math.PI / 2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 10;

    slices.forEach((slice) => {
      if (slice.value === 0) return;
      const angle = (slice.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      start += angle;
    });

    // Center hole (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    // Center text
    ctx.fillStyle = "#333";
    ctx.font = "bold 18px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 8);
    ctx.font = "11px Montserrat, sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText("artisans", cx, cy + 10);
  }, [activeTab, stats]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  const handleArtisanClick = async (artisan) => {
    setPopupLoading(true);
    setArtisanPopup({ name: artisan.full_name, products: [] });
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/products/visits/artisan/${artisan.id}`,
      );
      setArtisanPopup({ name: artisan.full_name, products: res.data });
    } catch {
      setArtisanPopup({ name: artisan.full_name, products: [] });
    }
    setPopupLoading(false);
  };

  const handleDeleteClick = (e, artisan) => {
    e.stopPropagation();
    setDeleteReason("");
    setDeleteError("");
    setDeletePopup(artisan);
  };

  const handleStatusClick = (e, artisan) => {
    e.stopPropagation();
    setStatusPopup(artisan);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReason.trim()) {
      setDeleteError("Veuillez entrer une raison de suppression.");
      return;
    }
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/admin/artisan/${deletePopup.id}`,
        auth,
      );
      const phone = deletePopup.phone_number
        ? deletePopup.phone_number.replace(/\D/g, "")
        : "212636823256";
      const message = encodeURIComponent(
        `Bonjour ${deletePopup.full_name},\n\nVotre compte artisan a été supprimé.\n\nRaison : ${deleteReason}\n\nCordialement,\nL'équipe Artisans du Maroc`,
      );
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      setArtisans(artisans.filter((a) => a.id !== deletePopup.id));
      setDeletePopup(null);
    } catch {
      setDeleteError("Erreur lors de la suppression. Veuillez réessayer.");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setStatusLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/artisan/${statusPopup.id}/status`,
        { status: newStatus },
        auth,
      );
      setArtisans((prev) =>
        prev.map((a) =>
          a.id === statusPopup.id ? { ...a, status: newStatus } : a,
        ),
      );
      setStatusPopup(null);
    } catch {
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setStatusLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      actif: { label: "✅ Actif", cls: "admin-status-actif" },
      en_attente: { label: "⏳ En attente", cls: "admin-status-attente" },
      bloque: { label: "🚫 Bloqué", cls: "admin-status-bloque" },
    };
    const s = map[status] || map["en_attente"];
    return <span className={`admin-status-badge ${s.cls}`}>{s.label}</span>;
  };

  const filtered = artisans.filter((a) => {
    const ratingOk =
      ratingFilter === "all" || (a.average_rating || 0) >= Number(ratingFilter);
    const statusOk = statusFilter === "all" || a.status === statusFilter;
    return ratingOk && statusOk;
  });

  const total = stats
    ? stats.artisans_actif + stats.artisans_en_attente + stats.artisans_bloque
    : 0;
  const pct = (val) => (total > 0 ? ((val / total) * 100).toFixed(1) : 0);

  return (
    <div className="artisan-dashboard">
      {/* SIDEBAR */}
      <aside className="artisan-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-avatar">👑</div>
          <p className="admin-label">Administrateur</p>
        </div>
        <nav>
          <div
            className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            📊 Statistiques
          </div>
          <div
            className={`nav-item ${activeTab === "clients" ? "active" : ""}`}
            onClick={() => setActiveTab("clients")}
          >
            👤 Clients
          </div>
          <div
            className={`nav-item ${activeTab === "artisans" ? "active" : ""}`}
            onClick={() => setActiveTab("artisans")}
          >
            🧑‍🎨 Artisans
          </div>
          <div
            className={`nav-item ${activeTab === "feedbacks" ? "active" : ""}`}
            onClick={() => setActiveTab("feedbacks")}
          >
            ⭐ Avis Site
          </div>
          <div className="nav-item logout-item" onClick={handleLogout}>
            🚪 Déconnexion
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="artisan-main">
        <div className="artisan-card">
          {/* ── STATS TAB ── */}
          {activeTab === "stats" && (
            <>
              <h2 className="card-title">Statistiques du site</h2>

              {!stats ? (
                <p className="admin-empty">Chargement...</p>
              ) : (
                <>
                  {/* ── KPI cards ── */}
                  <div className="stats-kpi-grid">
                    <div className="stats-kpi-card">
                      <span className="stats-kpi-icon">🧑‍🎨</span>
                      <span className="stats-kpi-value">
                        {stats.total_artisans}
                      </span>
                      <span className="stats-kpi-label">Artisans</span>
                    </div>
                    <div className="stats-kpi-card">
                      <span className="stats-kpi-icon">👤</span>
                      <span className="stats-kpi-value">
                        {stats.total_clients}
                      </span>
                      <span className="stats-kpi-label">Clients</span>
                    </div>
                    <div className="stats-kpi-card">
                      <span className="stats-kpi-icon">📦</span>
                      <span className="stats-kpi-value">
                        {stats.total_products}
                      </span>
                      <span className="stats-kpi-label">Produits</span>
                    </div>
                    <div className="stats-kpi-card">
                      <span className="stats-kpi-icon">👁</span>
                      <span className="stats-kpi-value">
                        {stats.total_visits}
                      </span>
                      <span className="stats-kpi-label">Visites produits</span>
                    </div>
                  </div>

                  {/* ── Best artisan + best product ── */}
                  <div className="stats-best-row">
                    {stats.best_artisan && (
                      <div className="stats-best-card">
                        <p className="stats-best-title">🏆 Meilleur Artisan</p>
                        <p className="stats-best-name">
                          {stats.best_artisan.full_name}
                        </p>
                        <p className="stats-best-sub">
                          📍 {stats.best_artisan.city}
                        </p>
                        <p className="stats-best-rating">
                          ★{" "}
                          {Number(stats.best_artisan.average_rating).toFixed(1)}
                        </p>
                      </div>
                    )}
                    {stats.best_product && (
                      <div className="stats-best-card">
                        <p className="stats-best-title">🥇 Meilleur Produit</p>
                        <p className="stats-best-name">
                          {stats.best_product.title}
                        </p>
                        <p className="stats-best-sub">
                          🧑‍🎨 {stats.best_product.artisan_name}
                        </p>
                        <p className="stats-best-rating">
                          ★{" "}
                          {Number(stats.best_product.average_rating).toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Pie chart ── */}
                  <div className="stats-chart-section">
                    <p className="stats-chart-title">
                      Répartition des artisans par statut
                    </p>
                    <div className="stats-chart-wrap">
                      <canvas ref={canvasRef} width={220} height={220} />
                      <div className="stats-chart-legend">
                        <div className="stats-legend-item">
                          <span
                            className="stats-legend-dot"
                            style={{ background: "#27ae60" }}
                          />
                          <span>
                            Actif — {stats.artisans_actif} (
                            {pct(stats.artisans_actif)}%)
                          </span>
                        </div>
                        <div className="stats-legend-item">
                          <span
                            className="stats-legend-dot"
                            style={{ background: "#f39c12" }}
                          />
                          <span>
                            En attente — {stats.artisans_en_attente} (
                            {pct(stats.artisans_en_attente)}%)
                          </span>
                        </div>
                        <div className="stats-legend-item">
                          <span
                            className="stats-legend-dot"
                            style={{ background: "#e74c3c" }}
                          />
                          <span>
                            Bloqué — {stats.artisans_bloque} (
                            {pct(stats.artisans_bloque)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── CLIENTS TAB ── */}
          {activeTab === "clients" && (
            <>
              <h2 className="card-title">Liste des Clients</h2>
              <div className="admin-stats-badge">
                {clients.length} client{clients.length !== 1 ? "s" : ""} inscrit
                {clients.length !== 1 ? "s" : ""}
              </div>
              {clients.length === 0 ? (
                <p className="admin-empty">Aucun client pour le moment.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom complet</th>
                      <th>Email</th>
                      <th>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr key={c.id}>
                        <td className="admin-index">{i + 1}</td>
                        <td className="admin-name">{c.full_name}</td>
                        <td>{c.email}</td>
                        <td>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── ARTISANS TAB ── */}
          {activeTab === "artisans" && (
            <>
              <h2 className="card-title">Liste des Artisans</h2>
              <div className="admin-filter-bar">
                <label className="admin-filter-label">Note :</label>
                <select
                  className="admin-filter-select"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="4">★ 4 et +</option>
                  <option value="3">★ 3 et +</option>
                  <option value="2">★ 2 et +</option>
                  <option value="1">★ 1 et +</option>
                </select>
                <label
                  className="admin-filter-label"
                  style={{ marginLeft: "20px" }}
                >
                  Statut :
                </label>
                <select
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous</option>
                  <option value="actif">✅ Actif</option>
                  <option value="en_attente">⏳ En attente</option>
                  <option value="bloque">🚫 Bloqué</option>
                </select>
              </div>
              <div className="admin-stats-badge">
                {filtered.length} artisan{filtered.length !== 1 ? "s" : ""}
              </div>
              {filtered.length === 0 ? (
                <p className="admin-empty">Aucun artisan pour ce filtre.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom complet</th>
                      <th>Email</th>
                      <th>Ville</th>
                      <th>Produits</th>
                      <th>Note</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr
                        key={a.id}
                        className="admin-artisan-row"
                        onClick={() => handleArtisanClick(a)}
                      >
                        <td className="admin-index">{i + 1}</td>
                        <td className="admin-name">{a.full_name}</td>
                        <td>{a.email}</td>
                        <td>{a.city || "—"}</td>
                        <td className="admin-product-count">
                          {a.product_count || 0} produit
                          {a.product_count !== 1 ? "s" : ""}
                        </td>
                        <td className="admin-rating">
                          {a.average_rating ? (
                            `★ ${a.average_rating}`
                          ) : (
                            <span style={{ color: "#ccc" }}>—</span>
                          )}
                        </td>
                        <td
                          onClick={(e) => handleStatusClick(e, a)}
                          style={{ cursor: "pointer" }}
                        >
                          <StatusBadge status={a.status} />
                        </td>
                        <td>
                          <button
                            className="admin-delete-btn"
                            onClick={(e) => handleDeleteClick(e, a)}
                          >
                            🗑 Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── FEEDBACKS TAB ── */}
          {activeTab === "feedbacks" && (
            <>
              <h2 className="card-title">Avis sur le site</h2>
              <div className="feedback-admin-stats">
                <div className="feedback-admin-stat">
                  <span className="feedback-admin-stat-value">
                    ★ {feedbackAvg}
                  </span>
                  <span className="feedback-admin-stat-label">
                    Note moyenne
                  </span>
                </div>
                <div className="feedback-admin-stat">
                  <span className="feedback-admin-stat-value">
                    {feedbackTotal}
                  </span>
                  <span className="feedback-admin-stat-label">Avis total</span>
                </div>
              </div>
              {feedbacks.length === 0 ? (
                <p className="admin-empty">Aucun avis pour le moment.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Note</th>
                      <th>Commentaire</th>
                      <th>Type</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f, i) => (
                      <tr key={f.id}>
                        <td className="admin-index">{i + 1}</td>
                        <td style={{ color: "#f4a733", fontWeight: 700 }}>
                          {"★".repeat(f.stars)}
                          {"☆".repeat(5 - f.stars)}
                        </td>
                        <td style={{ color: "#555" }}>
                          {f.comment || (
                            <span style={{ color: "#ccc" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`feedback-type-badge ${f.user_type === "client" ? "feedback-type-client" : "feedback-type-visiteur"}`}
                          >
                            {f.user_type === "client"
                              ? "👤 Client"
                              : "👁 Visiteur"}
                          </span>
                        </td>
                        <td style={{ color: "#aaa", fontSize: "13px" }}>
                          {new Date(f.created_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </main>

      {/* ARTISAN PRODUCTS POPUP */}
      {artisanPopup && (
        <div className="modal-overlay" onClick={() => setArtisanPopup(null)}>
          <div
            className="modal-content comments-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <button
              className="modal-close"
              onClick={() => setArtisanPopup(null)}
            >
              ✕
            </button>
            <h2 style={{ color: "#b35935", marginBottom: "6px" }}>
              📦 Produits de l'artisan
            </h2>
            <p
              style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}
            >
              {artisanPopup.name}
            </p>
            {popupLoading ? (
              <p style={{ textAlign: "center", color: "#aaa" }}>
                Chargement...
              </p>
            ) : artisanPopup.products.length === 0 ? (
              <p style={{ textAlign: "center", color: "#aaa" }}>
                Aucun produit pour cet artisan.
              </p>
            ) : (
              <table className="comments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Prix</th>
                    <th>Note</th>
                    <th>Visites</th>
                  </tr>
                </thead>
                <tbody>
                  {artisanPopup.products.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ color: "#bbb", fontWeight: 700 }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.title}</td>
                      <td style={{ color: "#b35935", fontWeight: 600 }}>
                        {Number(p.price).toFixed(2)} DH
                      </td>
                      <td style={{ color: "#f0a500" }}>
                        {p.average_rating ? (
                          `★ ${Number(p.average_rating).toFixed(1)}`
                        ) : (
                          <span style={{ color: "#ccc" }}>—</span>
                        )}
                      </td>
                      <td>👁 {p.visit_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* STATUS CHANGE POPUP */}
      {statusPopup && (
        <div className="modal-overlay" onClick={() => setStatusPopup(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "400px" }}
          >
            <button
              className="modal-close"
              onClick={() => setStatusPopup(null)}
            >
              ✕
            </button>
            <h2 style={{ color: "#b35935", marginBottom: "6px" }}>
              Modifier le statut
            </h2>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
              {statusPopup.full_name}
            </p>
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                Statut actuel :{" "}
              </span>
              <StatusBadge status={statusPopup.status} />
            </div>
            <div className="admin-status-actions">
              {statusPopup.status !== "actif" && (
                <button
                  onClick={() => handleUpdateStatus("actif")}
                  disabled={statusLoading}
                  className="admin-status-action-btn admin-status-action-actif"
                >
                  ✅ Activer le compte
                </button>
              )}
              {statusPopup.status !== "bloque" && (
                <button
                  onClick={() => handleUpdateStatus("bloque")}
                  disabled={statusLoading}
                  className="admin-status-action-btn admin-status-action-bloque"
                >
                  🚫 Bloquer le compte
                </button>
              )}
              {statusPopup.status !== "en_attente" && (
                <button
                  onClick={() => handleUpdateStatus("en_attente")}
                  disabled={statusLoading}
                  className="admin-status-action-btn admin-status-action-attente"
                >
                  ⏳ Remettre en attente
                </button>
              )}
            </div>
            {statusLoading && (
              <p
                style={{
                  textAlign: "center",
                  color: "#aaa",
                  marginTop: "12px",
                  fontSize: "13px",
                }}
              >
                Mise à jour en cours...
              </p>
            )}
          </div>
        </div>
      )}

      {/* DELETE POPUP */}
      {deletePopup && (
        <div className="modal-overlay" onClick={() => setDeletePopup(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "500px",
              textAlign: "left",
            }}
          >
            <button
              className="modal-close"
              onClick={() => setDeletePopup(null)}
            >
              ✕
            </button>
            <h2 style={{ color: "#e74c3c", marginBottom: "6px" }}>
              🗑 Supprimer l'artisan
            </h2>
            <p
              style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}
            >
              {deletePopup.full_name}
            </p>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                Raison de la suppression *
              </label>
              <textarea
                rows="4"
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  setDeleteError("");
                }}
                placeholder="Expliquez la raison..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: deleteError ? "2px solid #e74c3c" : "1px solid #eee",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              {deleteError && (
                <p
                  style={{
                    color: "#e74c3c",
                    fontSize: "12px",
                    marginTop: "6px",
                  }}
                >
                  {deleteError}
                </p>
              )}
            </div>
            <p
              style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}
            >
              📱 Un message WhatsApp sera envoyé à l'artisan avec la raison de
              la suppression.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                CONFIRMER & ENVOYER
              </button>
              <button
                onClick={() => setDeletePopup(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
