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

export const loginRequest = (identifier: string, password: string, remember: boolean = false) =>
  post("/api/auth/login", { identifier, password, remember });

export const registerRequest = (d: {
  name: string;
  registrationMethod?: "email" | "phone";
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  otp?: string;
}) => post("/api/auth/register", d);

export const logoutRequest = () => post("/api/auth/logout", {});

export const forgotPasswordRequest = (identifier: string) =>
  post("/api/auth/forgot-password", { identifier });

export const resetPasswordRequest = (d: {
  token: string;
  password: string;
  confirmPassword: string;
}) => post("/api/auth/reset-password", d);

export const adminForgotPasswordRequest = (email: string) =>
  post("/api/admin/auth/forgot-password", { email });

export const adminResetPasswordRequest = (d: {
  token: string;
  password: string;
  confirmPassword: string;
}) => post("/api/admin/auth/reset-password", d);
