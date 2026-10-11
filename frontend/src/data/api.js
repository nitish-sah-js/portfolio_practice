const PASSWORD_KEY = "editor-password";

export function getSavedPassword() {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) || "";
  } catch {
    return "";
  }
}

export function savePassword(password) {
  try {
    if (password) sessionStorage.setItem(PASSWORD_KEY, password);
    else sessionStorage.removeItem(PASSWORD_KEY);
  } catch {
    // Storage blocked — the editor still works until the tab closes.
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (auth) headers["x-admin-password"] = getSavedPassword();
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(path, { method, headers, body });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const fetchProjects = () => request("/api/projects");

export const login = (password) =>
  request("/api/login", { method: "POST", body: { password } });

export const createProject = (project) =>
  request("/api/projects", { method: "POST", body: project, auth: true });

export const updateProject = (id, project) =>
  request(`/api/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: project,
    auth: true,
  });

export const deleteProject = (id) =>
  request(`/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });

export const reorderProjects = (ids) =>
  request("/api/projects-order", { method: "PUT", body: { ids }, auth: true });

export async function uploadFiles(files) {
  const form = new FormData();
  [...files].forEach((file) => form.append("files", file));
  const data = await request("/api/upload", { method: "POST", body: form, auth: true });
  return data.files;
}
