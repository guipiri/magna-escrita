export interface PriceTierResponse {
  id: string;
  minQuantity: number;
  unitPrice: number;
}

export interface PriceClassResponse {
  id: string;
  name: string;
  schoolName: string;
  unitName: string | null;
}

export interface GetPricesResponse {
  id: string;
  name: string | null;
  tiers: PriceTierResponse[];
  classes: PriceClassResponse[];
}

export interface CreatePriceTierRequest {
  minQuantity: number;
  unitPrice: number;
}

export interface CreatePriceRequest {
  name: string;
  tiers: CreatePriceTierRequest[];
  classIds: string[];
}

export interface CreatePriceResponse {
  id: string;
  name: string | null;
}

export interface UpdatePriceRequest {
  name: string;
  tiers: CreatePriceTierRequest[];
  classIds: string[];
}
