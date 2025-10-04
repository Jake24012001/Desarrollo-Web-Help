import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarPeticion } from './actualizar-peticion';

describe('ActualizarPeticion', () => {
  let component: ActualizarPeticion;
  let fixture: ComponentFixture<ActualizarPeticion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarPeticion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarPeticion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
