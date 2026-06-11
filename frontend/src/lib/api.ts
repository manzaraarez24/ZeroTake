const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || "Something went wrong", res.status);
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  storeName: string;
  planStatus: string;
  stripeConnectId?: string | null;
  stripeCustomerId?: string | null;
  razorpayKeyId?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export function register(email: string, password: string, storeName: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password, storeName },
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe(token: string) {
  return request<{ user: User }>("/auth/me", { token });
}

// ─── Products ────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  price: number;
  fileUrl: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
};

export function listProducts(token: string) {
  return request<{ products: Product[] }>("/products", { token });
}

export function getProduct(token: string, id: string) {
  return request<{ product: Product }>(`/products/${id}`, { token });
}

export function createProduct(
  token: string,
  data: { title: string; description: string; price: number; fileUrl?: string; isPublished?: boolean }
) {
  return request<{ product: Product }>("/products", {
    method: "POST",
    body: data,
    token,
  });
}

export function updateProduct(
  token: string,
  id: string,
  data: Partial<{ title: string; description: string; price: number; fileUrl: string; isPublished: boolean }>
) {
  return request<{ product: Product }>(`/products/${id}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export function deleteProduct(token: string, id: string) {
  return request<{ message: string }>(`/products/${id}`, {
    method: "DELETE",
    token,
  });
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export function getPresignedUploadUrl(token: string, fileName: string, contentType: string) {
  return request<{ uploadUrl: string; key: string }>("/upload/presigned-url", {
    method: "POST",
    body: { fileName, contentType },
    token,
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function updateProfile(token: string, storeName: string) {
  return request<{ user: User }>("/auth/profile", {
    method: "PATCH",
    body: { storeName },
    token,
  });
}

// ─── Storefront (public) ──────────────────────────────────────────────────────

export type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  aiChatEnabled: boolean;
  createdAt: string;
};

export type StorefrontCreator = {
  id: string;
  storeName: string;
  products: StorefrontProduct[];
};

export function getStorefront(slug: string) {
  return request<{ creator: StorefrontCreator }>(`/storefront/${slug}`);
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

export function getStripeConnectOnboardUrl(token: string) {
  return request<{ url: string }>("/stripe/connect/onboard", { token });
}

export function getStripeConnectStatus(token: string) {
  return request<{
    isConnected: boolean;
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
    payoutsEnabled?: boolean;
  }>("/stripe/connect/status", { token });
}

export function createSubscriptionCheckout(token: string) {
  return request<{ url: string }>("/stripe/subscription/checkout", {
    method: "POST",
    token,
  });
}

// ─── Razorpay account (creator payout) ───────────────────────────────────────

export function saveRazorpayAccount(token: string, razorpayKeyId: string | null) {
  return request<{ user: User }>("/auth/razorpay-account", {
    method: "PATCH",
    body: { razorpayKeyId },
    token,
  });
}

// ─── Razorpay ────────────────────────────────────────────────────────────────

export function createRazorpayOrder(productId: string, buyerEmail: string) {
  return request<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    productTitle: string;
  }>("/razorpay/create-order", {
    method: "POST",
    body: { productId, buyerEmail },
  });
}

export function createRazorpaySubscription(token: string) {
  return request<{ subscriptionId: string; keyId: string }>("/razorpay/create-subscription", {
    method: "POST",
    token,
  });
}

export { ApiError };
