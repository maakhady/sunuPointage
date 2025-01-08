import { TestBed } from '@angular/core/testing';

import { GetpointageService } from './getpointage.service';

describe('GetpointageService', () => {
  let service: GetpointageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetpointageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
