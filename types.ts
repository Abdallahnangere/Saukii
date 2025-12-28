export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO';
  data: string;
  validity: string;
  price: number;
}

export interface Transaction {
  id: string;
  tx_ref: string;
  type: 'ecommerce' | 'data';
  status: 'pending' | 'paid' | 'delivered' | 'failed';
  phone: string;
  amount: number;
  createdAt: string;
}

export interface PaymentInitResponse {
  tx_ref: string;
  bank: string;
  account_number: string;
  account_name: string;
  amount: number;
}

export type NetworkType = 'MTN' | 'AIRTEL' | 'GLO';