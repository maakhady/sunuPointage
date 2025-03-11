import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartementService } from '../../../services/departement.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface ApiResponse {
  data: Employe;
  status: boolean;
}

interface Photo {
  data: string;
  mime_type: string;
  name: string;
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
  cohorte_id: string;
  photo: Photo | null;
  status: string;
  type: string;
  selected?: boolean;
  departement: {
    id: string;
    nom: string;
  }| null;
  cohorte: {
    id: string;
    nom: string;
    annee_scolaire: string;
    promo: number;
  };
  pointages: {
    _id: string;
    user_id: string;
    date: string;
    premierPointage_temp: string;
    estRetard_temp: boolean;
    estPresent: boolean;
    estEnAttente: boolean;
    updated_at: string;
    created_at: string;
  }[];
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
  pointage: any;

  constructor(
    private route: ActivatedRoute,
    private departementService: DepartementService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const employeId = this.route.snapshot.params['id'];
    if (employeId) {
      this.loadEmployeDetails(employeId);
    }
  }

  getPhotoUrl(photo: Photo | null): SafeUrl {
    if (!photo || !photo.data) {
      return 'assets/images/default-avatar.png';
    }

    const base64Image = `data:${photo.mime_type};base64,${photo.data}`;
    return this.sanitizer.bypassSecurityTrustUrl(base64Image);
  }

  loadEmployeDetails(id: string): void {
    this.loading = true;
    this.departementService.getUserById(id).subscribe({
      next: (response: ApiResponse) => {
        this.employe = response.data;
        console.log(response);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails:', err);
        this.loading = false;
      }
    });
  }
}