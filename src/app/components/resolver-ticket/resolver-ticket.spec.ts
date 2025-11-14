import { TestBed, ComponentFixture } from '@angular/core/testing';

import { ResolverTicket } from './resolver-ticket';

describe('ResolverTicket', () => {
  let component: ResolverTicket;
  let fixture: ComponentFixture<ResolverTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolverTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(ResolverTicket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
