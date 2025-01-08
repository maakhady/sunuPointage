import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Cohorte } from './cohorte.model';
import * as bootstrap from 'bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cohortes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cohortes.component.html',
  styleUrls: ['./cohortes.component.scss']
})
export class CohortesComponent implements OnInit {
  cohortes: Cohorte[] = [];
  loading: boolean = true;
  error: string | null = null;
  cohorteForm: FormGroup;
  isEditMode: boolean = false;
  currentCohorteId: string | null = null;
  private modalInstance: any;
  filteredCohortes: Cohorte[] = [];
  searchQuery: string = '';

  constructor(private apiService: ApiService, private router: Router) {
    this.cohorteForm = new FormGroup({
      nom: new FormControl('', [Validators.required]),
      annee_scolaire: new FormControl('', [Validators.required]),
      promo: new FormControl(0, [Validators.required]),
      identifiant: new FormControl({ value: '', disabled: true })
    });
  }

  ngOnInit(): void {
    this.loadCohortes();
  }

  loadCohortes(): void {
    this.apiService.getCohortes().subscribe({
      next: (cohortes: Cohorte[]) => {
        console.log('Cohortes reçues :', cohortes);
        this.cohortes = cohortes;
        this.filteredCohortes = cohortes; // Initialisation du tableau filtré
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des cohortes:', err);
        this.error = 'Erreur lors de la récupération des cohortes';
        this.loading = false;
      }
    });
  }

  editCohorte(cohorte: Cohorte): void {
    this.isEditMode = true;
    this.currentCohorteId = cohorte.id;
    this.cohorteForm.patchValue({
      nom: cohorte.nom,
      annee_scolaire: cohorte.annee_scolaire,
      promo: cohorte.promo,
      identifiant: cohorte.id
    });

    const modalElement = document.getElementById('exampleModal1');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  onSubmit(): void {
    if (this.cohorteForm.valid) {
      const cohorteData: Cohorte = {
        id: this.isEditMode && this.currentCohorteId ? this.currentCohorteId : '',
        nom: this.cohorteForm.get('nom')?.value,
        annee_scolaire: this.cohorteForm.get('annee_scolaire')?.value,
        promo: this.cohorteForm.get('promo')?.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        apprenants: []
      };

      if (this.isEditMode && this.currentCohorteId) {
        this.apiService.updateCohorte(this.currentCohorteId, cohorteData).subscribe({
          next: () => {
            this.loadCohortes();
            this.resetForm();
            if (this.modalInstance) {
              this.modalInstance.hide();
            }
          },
          error: (err) => {
            console.error('Erreur lors de la modification:', err);
            alert('Erreur lors de la modification de la cohorte');
          }
        });
      } else {
        this.apiService.createCohorte(cohorteData).subscribe({
          next: () => {
            this.loadCohortes();
            this.resetForm();
            window.location.reload();
            this.closeModal('exampleModal');
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout:', err);
            alert('Erreur lors de l\'ajout de la cohorte');
          }
        });
      }
    }
  }

  resetForm(): void {
    this.cohorteForm.reset();
    this.isEditMode = false;
    this.currentCohorteId = null;
  }

  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  onSearch(): void {
    console.log('Recherche en cours pour:', this.searchQuery);
    this.filteredCohortes = this.cohortes.filter(cohorte =>
      cohorte.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) 
    );
    console.log('Cohortes filtrées:', this.filteredCohortes);
  }

  getNombreApprenants(cohorte: Cohorte): number {
    return cohorte.apprenants?.length || 0;
  }

  voirApprenants(cohorteId: string): void {
    this.router.navigate(['/cohortes', cohorteId, 'apprenants']);
  }

  deleteCohorte(id: string): void {
    const cohorte = this.cohortes.find(c => c.id === id);
    
    if (!cohorte) {
      alert('Cohorte non trouvée');
      return;
    }

    if (this.getNombreApprenants(cohorte) > 0) {
      alert('Impossible de supprimer une cohorte qui contient des apprenants');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette cohorte ?')) {
      this.apiService.deleteCohorte(id).subscribe({
        next: () => {
          this.loadCohortes();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression de la cohorte');
        }
      });
    }
  }
}