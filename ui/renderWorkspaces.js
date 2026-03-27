export function renderWorkspaces(workspaces, { onOpen, onDelete, onEdit, onReorder }) {
  const list = document.getElementById("workspace-list");
  list.innerHTML = "";

  if (workspaces.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No saved workspaces yet.";
    list.appendChild(empty);
    return;
  }

  let dragSrcId = null;

  workspaces.forEach(ws => {
    const li = document.createElement("li");
    li.className = "tab-item";
    li.draggable = true;
    li.dataset.id = String(ws.id);

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⠿";

    const name = document.createElement("span");
    name.textContent = ws.name;

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => onOpen(ws.id));

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => onEdit(ws.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "close-btn";
    deleteBtn.addEventListener("click", () => onDelete(ws.id, ws.name));

    li.addEventListener("dragstart", e => {
      dragSrcId = ws.id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      list.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
    });

    li.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      list.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      if (dragSrcId !== ws.id) li.classList.add("drag-over");
    });

    li.addEventListener("drop", e => {
      e.preventDefault();
      li.classList.remove("drag-over");
      if (dragSrcId === ws.id) return;

      const srcIndex = workspaces.findIndex(w => w.id === dragSrcId);
      const dstIndex = workspaces.findIndex(w => w.id === ws.id);

      const reordered = [...workspaces];
      const [moved] = reordered.splice(srcIndex, 1);
      reordered.splice(dstIndex, 0, moved);

      onReorder(reordered);
    });

    li.appendChild(handle);
    li.appendChild(name);
    li.appendChild(openBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}
