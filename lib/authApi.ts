async function post(path: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Something went wrong. Please try again.");
  return data;
}

export const loginRequest = (email: string, password: string, remember: boolean) =>
  post("/api/auth/login", { email, password, remember });


export const registerRequest = (d: {
  name: string; email: string; phone: string; password: string; confirmPassword: string;
}) => post("/api/auth/register", d);
