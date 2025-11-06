import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentanaPeticion } from './ventana-peticion';

describe('VentanaPeticion', () => {
  let component: VentanaPeticion;
  let fixture: ComponentFixture<VentanaPeticion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentanaPeticion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentanaPeticion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
