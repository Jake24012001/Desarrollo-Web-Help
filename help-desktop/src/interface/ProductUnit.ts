import { InventoryUnit } from "./InventoryUnit";
import { ProductUnitId } from "./ProductUnitId";
import { UnidadAdministrativa } from "./UnidadAdministrativa";

export interface ProductUnit {
  id: ProductUnitId;
  inventoryUnit: InventoryUnit;
  unidadAdministrativa: UnidadAdministrativa;
}

