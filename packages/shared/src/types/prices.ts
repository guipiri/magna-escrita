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
