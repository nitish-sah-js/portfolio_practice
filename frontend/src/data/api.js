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

export const login = (password) =>
  request("/api/login", { method: "POST", body: { password } });

// Each editable homepage section ("projects", "services") shares the same endpoints.
function collectionApi(collection) {
  const base = `/api/${collection}`;
  return {
    list: () => request(base),
    create: (item) => request(base, { method: "POST", body: item, auth: true }),
    update: (id, item) =>
      request(`${base}/${encodeURIComponent(id)}`, { method: "PUT", body: item, auth: true }),
    remove: (id) =>
      request(`${base}/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
    reorder: (ids) =>
      request(`${base}/order`, { method: "PUT", body: { ids }, auth: true }),
  };
}

export const projectsApi = collectionApi("projects");
export const servicesApi = collectionApi("services");

export const fetchProjects = projectsApi.list;
export const fetchServices = servicesApi.list;

export async function uploadFiles(files) {
  const form = new FormData();
  [...files].forEach((file) => form.append("files", file));
  const data = await request("/api/upload", { method: "POST", body: form, auth: true });
  return data.files;
}
