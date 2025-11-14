import { TestBed } from '@angular/core/testing';

import { InventoryUnitService } from './inventory-unit.service';

describe('InventoryUnitService', () => {
  let service: InventoryUnitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryUnitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
