import { TestBed } from '@angular/core/testing';

import { TicketImageService } from './ticket-image.service';

describe('TicketImageService', () => {
  let service: TicketImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
