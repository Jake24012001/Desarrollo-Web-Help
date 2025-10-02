import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ticket } from './ticket'; 

describe('ticket', () => {
  let service: ticket;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ticket]
    });
    service = TestBed.inject(ticket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});