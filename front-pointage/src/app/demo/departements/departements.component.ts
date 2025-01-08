import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DepartementService } from '../../services/departement.service';
import { Departement } from './departement.model';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-departements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ,FormsModule],
  templateUrl: './departements.component.html',
  styleUrls: ['./departements.component.scss']
})
export class DepartementsComponent implements OnInit {
  departements: Departement[] = [];
  loading: boolean = true;
  error: string | null = null;
  departementForm: FormGroup;
  isEditMode: boolean = false;
  currentDepartementId: string | null = null;

  filteredDepartements: Departement[] = [];
  searchQuery: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;

  constructor(private departementService: DepartementService, private router: Router) {
    this.departementForm = new FormGroup({
      nom: new FormControl('', [Validators.required, Validators.minLength(3)]),
      identifiant: new FormControl({ value: '', disabled: true })
    });

    this.departementForm.get('nom')?.valueChanges.subscribe(nom => {
      this.updateIdentifiant(nom);
    });
  }

  ngOnInit(): void {
    this.departementService.getDepartements().subscribe({
      next: (departements: Departement[]) => {
        this.departements = departements;
        this.filteredDepartements = departements; // Initialisation du tableau filtré
        this.totalPages = Math.ceil(this.departements.length / this.itemsPerPage);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de la récupération des départements';
        this.loading = false;
      }
    });
  }

  updateIdentifiant(nom: string): void {
    const identifiant = nom.substring(0, 3).toUpperCase();
    this.departementForm.get('identifiant')?.setValue(identifiant, { emitEvent: false });
  }

  editDepartement(departement: Departement): void {
    this.isEditMode = true;
    this.currentDepartementId = departement.id;
    this.departementForm.setValue({
      nom: departement.nom,
      identifiant: departement.nom.substring(0, 3).toUpperCase()
    });

    this.openModal('exampleModal1'); // Ouvrir le modal de modification
  }

  onSubmit(): void {
    if (this.departementForm.valid) {
      const departementData: Departement = {
        id: this.isEditMode && this.currentDepartementId ? this.currentDepartementId : '', // Ajoutez un id pour les nouveaux
        nom: this.departementForm.get('nom')?.value,
        utilisateurs: [] // Ajoutez une propriété utilisateurs
      };

      if (this.isEditMode && this.currentDepartementId) {
        this.departementService.updateDepartement(this.currentDepartementId, departementData).subscribe({
          next: (departement: Departement) => {
            const index = this.departements.findIndex(d => d.id === departement.id);
            if (index !== -1) {
              this.departements[index] = departement;
            }
            this.resetForm();
            this.closeModal('exampleModal1'); // Fermer le modal de modification
          },
          error: (err) => {
            alert('Erreur lors de la modification du département');
          }
        });
      } else {
        this.departementService.createDepartement(departementData).subscribe({
          next: (departement: Departement) => {
            this.departements.push(departement);
            this.filteredDepartements = this.departements; // Mettre à jour la liste filtrée
            this.totalPages = Math.ceil(this.departements.length / this.itemsPerPage);
            window.location.reload();
            this.resetForm();
            this.closeModal('exampleModal'); // Fermer le modal d'ajout
          },
          error: (err) => {
            alert('Le departement existe deja');
          }
        });
      }
    }
  }

  resetForm(): void {
    this.departementForm.reset();
    this.isEditMode = false;
    this.currentDepartementId = null;
  }

  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      } else {
        // Crée une nouvelle instance si aucune n'existe et la ferme immédiatement
        const newModalInstance = new bootstrap.Modal(modalElement);
        newModalInstance.hide();
      }
    }
  }

  voirEmployes(departementId: string): void {
    this.router.navigate(['/departements', departementId, 'employes']);
  }

  onSearch(): void {
    console.log('Recherche en cours pour:', this.searchQuery);
    this.filteredDepartements = this.departements.filter(departement =>
      departement.nom.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.totalPages = Math.ceil(this.filteredDepartements.length / this.itemsPerPage);
    this.currentPage = 1; // Réinitialiser la page actuelle lors de la recherche
  }

  getNombreEmploye(departement: Departement): number {
    return departement.utilisateurs?.length || 0;
  }

  private openModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  departementToDelete: any = null;

  deleteDepartement(id: string): void {
    // Trouve le département concerné
    const departement = this.departements.find(d => d.id === id);
    
    if (!departement) {
      alert('Département non trouvé');
      return;
    }
    
    // Vérifie le nombre d'utilisateurs
    if (this.getNombreEmploye(departement) > 0) {
      alert('Impossible de supprimer un département qui contient des utilisateurs');
      return;
    }
    
    // Stocke le département à supprimer et ouvre le modal
    this.departementToDelete = departement;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
  }

  confirmDelete(): void {
    if (this.departementToDelete) {
      this.departementService.deleteDepartement(this.departementToDelete.id).subscribe({
        next: () => {
          // Recharge la liste des départements après suppression
          this.departements = this.departements.filter(d => d.id !== this.departementToDelete.id);
          this.filteredDepartements = this.departements; // Mettre à jour la liste filtrée
          this.totalPages = Math.ceil(this.departements.length / this.itemsPerPage);
          
          // Ferme le modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
          modal?.hide();
          
         
          this.departementToDelete = null;
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression du département');
          this.departementToDelete = null;
        }
      });
    }
  }
  getPaginatedDepartements(): Departement[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredDepartements.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
