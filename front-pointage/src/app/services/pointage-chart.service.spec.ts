import { TestBed } from '@angular/core/testing';

import { PointageChartService } from './pointage-chart.service';

describe('PointageChartService', () => {
  let service: PointageChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PointageChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
