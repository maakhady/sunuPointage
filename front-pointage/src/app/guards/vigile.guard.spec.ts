import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { vigileGuard } from './vigile.guard';

describe('vigileGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => vigileGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
