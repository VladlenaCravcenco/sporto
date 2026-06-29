export interface OrderRequestItemInput {
  id: string;
  name_ro: string;
  name_ru: string;
  sku: string | null;
  price: number;
  qty: number;
  image_url: string | null;
}

export interface OrderRequestInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  clientType: 'individual' | 'company';
  deliveryAddress: string;
  notes: string;
  language: 'ru' | 'ro';
  website: string;
  items: OrderRequestItemInput[];
}

type OrderRequestResponse = {
  accepted?: boolean;
  orderId?: string;
  clientId?: string | null;
  error?: string;
  retryAfter?: number;
};

export class OrderRequestSubmissionError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export async function submitOrderRequest(input: OrderRequestInput): Promise<{ orderId: string; clientId: string | null }> {
  const response = await fetch('/api/order-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result = await response.json().catch(() => ({})) as OrderRequestResponse;
  if (!response.ok || !result.orderId) {
    throw new OrderRequestSubmissionError(result.error || 'request_not_saved', response.status);
  }

  return { orderId: result.orderId, clientId: result.clientId ?? null };
}

