import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorHelp } from './administrador-help';

describe('AdministradorHelp', () => {
  let component: AdministradorHelp;
  let fixture: ComponentFixture<AdministradorHelp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorHelp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradorHelp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
