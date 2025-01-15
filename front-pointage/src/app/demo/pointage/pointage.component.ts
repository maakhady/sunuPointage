import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GetpointageService, Pointage, ApiResponse } from '../../services/getpointage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-pointage',
  templateUrl: './pointage.component.html',
  styleUrls: ['./pointage.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class PointageComponent implements OnInit, OnDestroy {
  pointages: Pointage[] = [];
  filteredPointages: Pointage[] = [];
  paginatedPointages: Pointage[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  countPresent: number = 0;
  countRetard: number = 0;
  countAbsent: number = 0;

  // Gestion des congés
  congesForm: FormGroup;
  selectedUser: any = null;
  isEditMode: boolean = false;
  currentLeaveId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private getpointageService: GetpointageService,
    private fb: FormBuilder
  ) {
    this.congesForm = this.fb.group({
      date_debut: ['', Validators.required],
      date_fin: ['', Validators.required],
      motif: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadPointages();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPointages(): void {
    this.getpointageService.getAllPointages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.status && Array.isArray(response.data)) {
            this.pointages = response.data;
            this.filteredPointages = [...this.pointages];
            this.updateStatistics();
            this.updatePagination();
          } else {
            console.error('Données invalides reçues');
          }
        },
        error: (err) => {
          console.error(`Erreur: ${err.message || 'Erreur inconnue'}`);
        }
    });
  }

  updateStatistics(): void {
    this.countPresent = this.filteredPointages.filter(p => p.estPresent && !p.estRetard).length;
    this.countRetard = this.filteredPointages.filter(p => p.estRetard).length;
    this.countAbsent = this.filteredPointages.filter(p => !p.estPresent && !p.estRetard).length;
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredPointages.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPointages = this.filteredPointages.slice(start, start + this.itemsPerPage);
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredPointages = [...this.pointages];
    } else {
      const searchTerm = this.searchQuery.toLowerCase().trim();
      this.filteredPointages = this.pointages.filter(p =>
        p?.user?.nom?.toLowerCase().includes(searchTerm) ||
        p?.user?.prenom?.toLowerCase().includes(searchTerm) ||
        p?.user?.matricule?.toLowerCase().includes(searchTerm) ||
        `${p?.user?.nom} ${p?.user?.prenom}`.toLowerCase().includes(searchTerm)
      );
    }
    this.currentPage = 1;
    this.updateStatistics();
    this.updatePagination();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  formatTime(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusClass(pointage: Pointage): string {
    if (pointage.estPresent && !pointage.estRetard) return 'bg-success';
    if (pointage.estRetard) return 'bg-warning';
    return 'bg-danger';
  }

  getStatusText(pointage: Pointage): string {
    if (pointage.estPresent && !pointage.estRetard) return 'Présent';
    if (pointage.estRetard) return 'Retard';
    return 'Absent';
  }

  // Méthodes de gestion des congés
  openCongesModal(userId: string): void {
    this.selectedUser = this.pointages.find(p => p.user._id === userId)?.user;
    if (!this.selectedUser) {
      console.error('Utilisateur non trouvé');
      return;
    }

    // Réinitialisation
    this.errorMessage = null;
    this.successMessage = null;
    this.resetForm();

    // Ouvrir la modal
    const modal = new bootstrap.Modal(document.getElementById('congesModal'));
    modal.show();
  }

  submitConges(): void {
    if (this.congesForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    const dateDebut = new Date(this.congesForm.get('date_debut')?.value);
    const dateFin = new Date(this.congesForm.get('date_fin')?.value);

    // Validation des dates
    if (dateDebut >= dateFin) {
      this.errorMessage = 'La date de début doit être antérieure à la date de fin';
      return;
    }

    const leaveData = {
      user_id: this.selectedUser._id,
      date_debut: this.congesForm.get('date_debut')?.value,
      date_fin: this.congesForm.get('date_fin')?.value,
      type_conge: 'congé',
      motif: this.congesForm.get('motif')?.value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.getpointageService.storeConges(leaveData).subscribe({
      next: () => {
        this.successMessage = 'Congé enregistré avec succès';
        this.loadPointages();

        // Fermer la modal après 2 secondes
        setTimeout(() => {
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('congesModal'));
          modalInstance?.hide();
          this.resetForm();
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du congé:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'ajout du congé';
      }
    });
  }
  resetForm(): void {
    this.congesForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeModal(): void {
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('congesModal'));
    modalInstance?.hide();
    this.resetForm();
  }

  // Helpers pour la validation des formulaires
  isFieldInvalid(fieldName: string): boolean {
    const field = this.congesForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.congesForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return 'Le motif doit contenir au moins 10 caractères';
    }
    return '';
  }
}
