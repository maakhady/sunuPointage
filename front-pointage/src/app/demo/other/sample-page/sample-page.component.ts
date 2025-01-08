import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartementService } from '../../../services/departement.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { CommonModule } from '@angular/common';

interface ApiResponse {
  data: Employe;
  status: boolean;
}

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matricule: string;
  adresse: string;
  fonction: string;
  departement_id: string;
  photo: string | null;
  status: string;
  selected?: boolean;
}

@Component({
  selector: 'app-sample-page',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './sample-page.component.html',
  styleUrls: ['./sample-page.component.scss']
})
export default class SamplePageComponent implements OnInit {
  employe: Employe | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private departementService: DepartementService
  ) {}

  ngOnInit(): void {
    const employeId = this.route.snapshot.params['id'];
    if (employeId) {
      this.loadEmployeDetails(employeId);
    }
  }

  loadEmployeDetails(id: string): void {
    this.loading = true;
    this.departementService.getUserById(id).subscribe({
      next: (response: ApiResponse) => {
        this.employe = response.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails:', err);
        this.loading = false;
      }
    });
  }
}