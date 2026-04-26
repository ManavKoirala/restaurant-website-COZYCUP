function getApiBaseUrl() {
  if (window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  return "http://127.0.0.1:5000";
}

const API_BASE_URL = getApiBaseUrl();

const filterForm = document.getElementById("dateFilterForm");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const resetButton = document.getElementById("resetFilters");
const statusText = document.getElementById("adminStatus");
const reservationBody = document.getElementById("reservationBody");

let reservationsCache = [];
let editingReservationId = null;

function revealOnScroll() {
  const revealElements = document.querySelectorAll(".reveal-item:not(.visible)");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "-";
  }

  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function getReservationById(reservationId) {
  return reservationsCache.find((item) => Number(item.id) === Number(reservationId));
}

function renderReadOnlyRow(item) {
  const row = document.createElement("tr");
  row.dataset.id = String(item.id);

  row.innerHTML = `
    <td>${item.id}</td>
    <td>${escapeHtml(item.full_name)}</td>
    <td>${escapeHtml(item.email)}</td>
    <td>${formatDate(item.visit_date)}</td>
    <td>${escapeHtml(item.visit_time)}</td>
    <td>${item.guests}</td>
    <td>${escapeHtml(item.notes || "-")}</td>
    <td>${formatDateTime(item.created_at)}</td>
    <td>
      <div class="table-actions">
        <button type="button" class="table-btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" class="table-btn danger-btn" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    </td>
  `;

  return row;
}

function renderEditableRow(item) {
  const row = document.createElement("tr");
  row.dataset.id = String(item.id);

  row.innerHTML = `
    <td>${item.id}</td>
    <td><input class="admin-inline-input" type="text" data-field="full_name" value="${escapeHtml(item.full_name)}" required></td>
    <td><input class="admin-inline-input" type="email" data-field="email" value="${escapeHtml(item.email)}" required></td>
    <td><input class="admin-inline-input" type="date" data-field="visit_date" value="${escapeHtml(item.visit_date)}" required></td>
    <td><input class="admin-inline-input" type="time" data-field="visit_time" value="${escapeHtml(item.visit_time)}" required></td>
    <td><input class="admin-inline-input" type="number" data-field="guests" min="1" max="20" value="${item.guests}" required></td>
    <td><textarea class="admin-inline-input admin-inline-textarea" data-field="notes" rows="2">${escapeHtml(item.notes || "")}</textarea></td>
    <td>${formatDateTime(item.created_at)}</td>
    <td>
      <div class="table-actions">
        <button type="button" class="table-btn" data-action="save" data-id="${item.id}">Save</button>
        <button type="button" class="table-btn ghost-btn" data-action="cancel" data-id="${item.id}">Cancel</button>
      </div>
    </td>
  `;

  return row;
}

function renderReservations(items) {
  reservationsCache = items;
  reservationBody.innerHTML = "";

  if (!items.length) {
    editingReservationId = null;
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="9" class="empty-row">No reservations found for this date range.</td>';
    reservationBody.appendChild(row);
    setStatus("No reservations matched your filters.");
    return;
  }

  items.forEach((item) => {
    const row = Number(item.id) === Number(editingReservationId)
      ? renderEditableRow(item)
      : renderReadOnlyRow(item);
    reservationBody.appendChild(row);
  });

  setStatus(`Showing ${items.length} reservations.`);
}

function buildQuery() {
  const params = new URLSearchParams();

  if (fromDateInput.value) {
    params.set("from_date", fromDateInput.value);
  }
  if (toDateInput.value) {
    params.set("to_date", toDateInput.value);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function loadReservations() {
  setStatus("Loading reservations...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations${buildQuery()}`);
    if (!response.ok) {
      throw new Error("Failed to load reservations.");
    }

    const data = await response.json();
    renderReservations(data);
  } catch (error) {
    editingReservationId = null;
    reservationsCache = [];
    reservationBody.innerHTML = "";
    setStatus("Unable to fetch reservations right now.", true);
    console.error(error);
  }
}

function startEdit(reservationId) {
  if (editingReservationId && Number(editingReservationId) !== Number(reservationId)) {
    setStatus("Finish or cancel the current edit before opening another row.", true);
    return;
  }

  if (!getReservationById(reservationId)) {
    setStatus("Reservation no longer exists in this view.", true);
    return;
  }

  editingReservationId = Number(reservationId);
  renderReservations(reservationsCache);
  setStatus(`Editing reservation #${reservationId}.`);
}

function cancelEdit() {
  editingReservationId = null;
  renderReservations(reservationsCache);
  setStatus(`Showing ${reservationsCache.length} reservations.`);
}

function collectRowPayload(row) {
  const payload = {};
  const fields = row.querySelectorAll("[data-field]");

  fields.forEach((field) => {
    payload[field.dataset.field] = field.value;
  });

  payload.guests = Number(payload.guests);
  return payload;
}

async function saveEdit(reservationId) {
  const row = reservationBody.querySelector(`tr[data-id="${reservationId}"]`);
  if (!row) {
    setStatus("Could not find the row being edited.", true);
    return;
  }

  const payload = collectRowPayload(row);
  if (!payload.full_name || !payload.email || !payload.visit_date || !payload.visit_time || !payload.guests) {
    setStatus("Please complete all required fields before saving.", true);
    return;
  }

  setStatus(`Saving reservation #${reservationId}...`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to save reservation.");
    }

    editingReservationId = null;
    await loadReservations();
    setStatus(`Reservation #${reservationId} updated successfully.`);
  } catch (error) {
    setStatus(error.message || "Unable to save reservation right now.", true);
    console.error(error);
  }
}

async function deleteReservation(reservationId) {
  const existing = getReservationById(reservationId);
  if (!existing) {
    setStatus("Reservation no longer exists in this view.", true);
    return;
  }

  const confirmDelete = window.confirm(
    `Delete reservation #${reservationId} for ${existing.full_name}? This cannot be undone.`
  );

  if (!confirmDelete) {
    return;
  }

  setStatus(`Deleting reservation #${reservationId}...`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to delete reservation.");
    }

    if (Number(editingReservationId) === Number(reservationId)) {
      editingReservationId = null;
    }

    await loadReservations();
    setStatus(`Reservation #${reservationId} deleted successfully.`);
  } catch (error) {
    setStatus(error.message || "Unable to delete reservation right now.", true);
    console.error(error);
  }
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadReservations();
});

resetButton.addEventListener("click", () => {
  editingReservationId = null;
  filterForm.reset();
  loadReservations();
});

reservationBody.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const reservationId = Number(actionButton.dataset.id);

  if (!reservationId) {
    return;
  }

  if (action === "edit") {
    startEdit(reservationId);
    return;
  }

  if (action === "cancel") {
    cancelEdit();
    return;
  }

  if (action === "save") {
    saveEdit(reservationId);
    return;
  }

  if (action === "delete") {
    deleteReservation(reservationId);
  }
});

loadReservations();
revealOnScroll();
