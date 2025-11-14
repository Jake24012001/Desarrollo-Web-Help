import { TestBed } from '@angular/core/testing';

import { TicketCommentService } from './ticket-comment.service';

describe('TicketCommentService', () => {
  let service: TicketCommentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketCommentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
