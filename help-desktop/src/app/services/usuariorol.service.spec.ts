import { TestBed } from '@angular/core/testing';

import { UsuariorolService } from './usuariorol.service';

describe('UsuariorolService', () => {
  let service: UsuariorolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuariorolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
