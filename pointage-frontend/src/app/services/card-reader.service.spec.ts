import { TestBed } from '@angular/core/testing';

import { CardReaderService } from './card-reader.service';

describe('CardReaderService', () => {
  let service: CardReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
