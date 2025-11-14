import { TestBed } from '@angular/core/testing';

import { TicketAccessService } from './ticket-access.service';

describe('TicketAccessService', () => {
  let service: TicketAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
