export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}
