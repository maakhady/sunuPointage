import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CohortesComponent } from './cohortes.component';

describe('CohortesComponent', () => {
  let component: CohortesComponent;
  let fixture: ComponentFixture<CohortesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CohortesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CohortesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
