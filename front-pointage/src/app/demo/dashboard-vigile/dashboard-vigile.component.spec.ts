import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardVigileComponent } from './dashboard-vigile.component';

describe('DashboardVigileComponent', () => {
  let component: DashboardVigileComponent;
  let fixture: ComponentFixture<DashboardVigileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardVigileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardVigileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
