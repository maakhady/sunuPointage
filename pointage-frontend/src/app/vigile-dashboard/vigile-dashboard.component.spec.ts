import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VigileDashboardComponent } from './vigile-dashboard.component';

describe('VigileDashboardComponent', () => {
  let component: VigileDashboardComponent;
  let fixture: ComponentFixture<VigileDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VigileDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VigileDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
