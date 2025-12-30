export function renderWorkspaces(workspaces, { onOpen, onDelete, onEdit }) {
  const list = document.getElementById("workspace-list");
  list.innerHTML = "";

  workspaces.forEach(ws => {
    const li = document.createElement("li");
    li.className = "tab-item";

    const name = document.createElement("span");
    name.textContent = ws.name;

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => onOpen(ws.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "close-btn";
    deleteBtn.addEventListener("click", () => onDelete(ws.id));

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => onEdit(ws.id));

    li.appendChild(name);
    li.appendChild(openBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}
