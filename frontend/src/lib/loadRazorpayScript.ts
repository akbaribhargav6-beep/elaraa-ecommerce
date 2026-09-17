declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loadPromise: Promise<void> | null = null;

// Loaded on demand (only when a customer actually picks online payment)
// rather than on every checkout page visit, since most of this script is
// wasted for COD orders.
export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Could not load the payment gateway. Please check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}
