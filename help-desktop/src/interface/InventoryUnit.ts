import { Persona } from "./Persona";
import { Product } from "./Product";

export interface InventoryUnit {
  id?: number;
  stock?: number;
  product: Product;
  municipalCode?: string;
  serial?: string;
  maxStock?: number;
  minStock?: number;
  status?: string;
  custodian?: Persona;
  urlImg?: string;
}
