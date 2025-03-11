import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GetpointageService, Pointage, ApiResponse } from '../../services/getpointage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

  // Modal de gestion des congés
  congesForm: FormGroup;
  selectedUser: any = null;
  isEditMode: boolean = false;  // À définir en fonction du mode d'édition
  currentLeaveId: string | null = null;  // ID du congé en mode édition

  // Référence à la modal via @ViewChild
  @ViewChild('congesModal') congesModal: any;

  private destroy$ = new Subject<void>();

  constructor(
    private getpointageService: GetpointageService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.congesForm = this.fb.group({
      date_debut: ['', Validators.required],
      date_fin: ['', Validators.required],
      motif: ['', Validators.required]
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
    this.getpointageService.getAllPointages().pipe(takeUntil(this.destroy$)).subscribe({
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
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPointages = this.filteredPointages.slice(start, start + this.itemsPerPage);
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

  openCongesModal(userId: string): void {
    // Recherche l'utilisateur sélectionné dans la liste des pointages
    this.selectedUser = this.pointages.find(p => p.user._id === userId)?.user;
    // Ouvre la modal en utilisant NgbModal
    this.modalService.open(this.congesModal);  // Utilisation de la référence @ViewChild
  }

  submitConges(modal: any): void {
    if (this.congesForm.valid) {
      const leaveData = {
        user_id: this.selectedUser._id,
        date_debut: this.congesForm.get('date_debut')?.value,
        date_fin: this.congesForm.get('date_fin')?.value,
        type_conge: 'congé',
        motif: this.congesForm.get('motif')?.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Appel du service pour créer un congé
      this.getpointageService.storeConges(leaveData).subscribe({
        next: () => {
          this.loadConges();
          this.resetForm();
          modal.close();  // Fermeture de la modal après la soumission
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du congé:', err);
          alert('Erreur lors de l\'ajout du congé');
        }
      });
    }
  }


  loadConges(): void {
    // Recharger les congés (vous pouvez réutiliser la logique de `loadPointages`)
    this.loadPointages();
  }

  resetForm(): void {
    this.congesForm.reset();  // Réinitialiser le formulaire
  }
}
