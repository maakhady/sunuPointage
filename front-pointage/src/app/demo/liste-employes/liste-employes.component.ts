import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartementService } from '../../services/departement.service';
import { AssignationService } from '../../services/assignation.service';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { HttpErrorResponse } from '@angular/common/http';

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matricule: string;
  cardId: string;
  adresse: string;
  fonction: string;
  departement_id: string;
  photo: string | null;
  statut: string;
  selected?: boolean;
}

@Component({
  selector: 'app-liste-employes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './liste-employes.component.html',
  styleUrls: ['./liste-employes.component.scss']
})
export class ListeEmployesComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  employes: Employe[] = [];
  filteredEmployes: Employe[] = [];
  departementId: string = '';
  allSelected: boolean = false;
  isImporting: boolean = false;
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  employeForm: FormGroup;
  showPasswordField: boolean = false;
  selectedPhoto: File | null = null;
  selectedEmploye: Employe | null = null;

  // Assignation related
  private subscriptions: Subscription[] = [];
  scannedCardId: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showSuccessMessage: boolean = false;
  importSummary: {
    success: number;
    errors: string[];
  } | null = null;
  apiErrors: any;
  selectedEmployesToDelete: any[] = [];
  employeToDelete: any = null;

  constructor(
    private route: ActivatedRoute,
    private departementService: DepartementService,
    private router: Router,
    private fb: FormBuilder,
    private assignationService: AssignationService
  ) {
    this.employeForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      adresse: ['', Validators.required],
      fonction: ['', Validators.required],
      photo: [null],
      password: [{ value: '', disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    this.departementId = this.route.snapshot.params['id'];
    this.loadEmployes();

    // Écoute des scans de carte
    this.subscriptions.push(
      this.assignationService.cardId$.subscribe(
        cardId => {
          if (cardId) {
            this.scannedCardId = cardId;
            this.errorMessage = null;
            const cardInput = document.getElementById('cardIdInput') as HTMLInputElement;
            if (cardInput) {
              cardInput.value = cardId;
            }
          }
        }
      )
    );

    // Écoute des événements d'assignation réussie
    this.subscriptions.push(
      this.assignationService.getCardAssignedEvents().subscribe(
        response => {
          this.successMessage = response.message;
          this.loadEmployes();
          setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignCardModal'));
            modal?.hide();
            this.resetAssignationForm();
          }, 2000);
        }
      )
    );

    // Écoute des erreurs d'assignation
    this.subscriptions.push(
      this.assignationService.getCardAssignmentErrors().subscribe(
        error => {
          this.errorMessage = error.message;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.assignationService.disconnect();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmployes.length / this.itemsPerPage);
  }

  get paginatedEmployes(): Employe[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployes.slice(startIndex, startIndex + this.itemsPerPage);
  }



  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const formData = new FormData();
        formData.append('file', file);

        this.isImporting = true;
        this.showSuccessMessage = false;

        this.departementService.importEmployes(this.departementId, formData).subscribe({
          next: (response: any) => {
            this.importSummary = {
              success: response.data.imported.length,
              errors: response.data.errors
            };

            this.successMessage = `Importation réussie! ${this.importSummary.success} employé(s) importé(s)`;
            this.showSuccessMessage = true;
            this.loadEmployes();
            this.fileInput.nativeElement.value = '';
            this.isImporting = false;

            setTimeout(() => {
              this.showSuccessMessage = false;
            }, 7000);
          },
          error: (error) => {
            this.importSummary = {
              success: 0,
              errors: [error.message || 'Une erreur est survenue lors de l\'importation']
            };
            this.isImporting = false;
            this.fileInput.nativeElement.value = '';
          }
        });
      } else {
        alert('Veuillez sélectionner un fichier CSV valide');
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  loadEmployes(): void {
    this.departementService.getEmployesByDepartement(this.departementId).subscribe({
      next: (response: any) => {
        const employesData = Array.isArray(response) ? response : [];
        this.employes = employesData.map((employe: any) => ({
          id: employe.id || '',
          nom: employe.nom || '',
          prenom: employe.prenom || '',
          email: employe.email || '',
          telephone: employe.telephone || '',
          matricule: employe.matricule || '',
          cardId: employe.cardId || '',
          adresse: employe.adresse || '',
          fonction: employe.fonction || '',
          departement_id: employe.departement_id || '',
          photo: employe.photo || null,
          statut: employe.statut || '',
          selected: false
        }));
        this.filteredEmployes = this.employes;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des employés:', err);
        this.employes = [];
        this.filteredEmployes = [];
      }
    });
  }

  onSearch(): void {
    this.filteredEmployes = this.employes.filter(employe =>
      employe.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.matricule.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.currentPage = 1;
  }

  viewEmployeDetails(employe: Employe): void {
    this.router.navigate(['/sample-page', employe.id]);
  }

  toggleSelectAll(): void {
    this.allSelected = !this.allSelected;
    this.employes.forEach(employe => employe.selected = this.allSelected);
  }

  onSelectionChange(): void {
    this.allSelected = this.employes.every(employe => employe.selected);
  }

  hasSelectedEmployes(): boolean {
    return this.employes.some(employe => employe.selected);
  }

  getSelectedEmployes(): Employe[] {
    return this.employes.filter(employe => employe.selected);
  }

  onActionSelected(): void {
    const selectedEmployes = this.getSelectedEmployes();
    if (selectedEmployes.length === 0) {
      return;
    }
    this.selectedEmployesToDelete = selectedEmployes;
    const modal = new bootstrap.Modal(document.getElementById('deleteMultipleEmployesModal'));
    modal.show();
  }

  confirmMultipleDelete(): void {
    if (this.selectedEmployesToDelete.length > 0) {
      const deleteRequests = this.selectedEmployesToDelete.map(employe =>
        this.departementService.deleteEmploye(employe.id)
      );

      forkJoin(deleteRequests).subscribe({
        next: () => {
          console.log('Employés supprimés avec succès');
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteMultipleEmployesModal'));
          modal?.hide();
          this.loadEmployes();
          this.selectedEmployesToDelete = [];
        },
        error: (err) => {
          console.error('Erreur lors de la suppression multiple:', err);
          alert('Erreur lors de la suppression des employés');
          this.selectedEmployesToDelete = [];
        }
      });
    }
  }

  deleteEmploye(id: string): void {
    const employe = this.employes.find(e => e.id === id);
    if (!employe) {
      alert('Employé non trouvé');
      return;
    }
    this.employeToDelete = employe;
    const modal = new bootstrap.Modal(document.getElementById('deleteEmployeModal'));
    modal.show();
  }

  confirmDelete(): void {
    if (this.employeToDelete) {
      this.departementService.deleteEmploye(this.employeToDelete.id).subscribe({
        next: () => {
          console.log('Employé supprimé avec succès');
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteEmployeModal'));
          modal?.hide();
          this.loadEmployes();
          this.employeToDelete = null;
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression de l\'employé');
          this.employeToDelete = null;
        }
      });
    }
  }

  openAddEmployeModal(): void {
    this.employeForm.reset();
    this.showPasswordField = false;
    this.selectedPhoto = null;
    const modal = new bootstrap.Modal(document.getElementById('addEmployeModal'));
    modal.show();
  }

  openEditEmployeModal(employe: Employe): void {
    this.selectedEmploye = employe;

    this.employeForm.patchValue({
      nom: employe.nom,
      prenom: employe.prenom,
      email: employe.email,
      telephone: employe.telephone,
      adresse: employe.adresse,
      fonction: employe.fonction,
    });

    if (employe.fonction === 'DG' || employe.fonction === 'Vigile') {
      this.employeForm.get('password')?.enable();
      this.showPasswordField = true;
    } else {
      this.employeForm.get('password')?.disable();
      this.showPasswordField = false;
    }
    const modal = new bootstrap.Modal(document.getElementById('editEmployeModal'));
    modal.show();
  }

  onRoleChange(event: any): void {
    const role = event.target.value;
    if (role === 'DG' || role === 'Vigile') {
      this.employeForm.get('password')?.enable();
      this.showPasswordField = true;
    } else {
      this.employeForm.get('password')?.disable();
      this.showPasswordField = false;
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
    }
  }

  // Méthodes liées à l'assignation
  assignCardId(employe: Employe): void {
    this.selectedEmploye = employe;
    this.resetAssignationForm();
    const modal = new bootstrap.Modal(document.getElementById('assignCardModal'));
    modal.show();
  }

  confirmAssignCardId(): void {
    if (this.selectedEmploye && this.scannedCardId) {
      this.assignationService.assignCardSocket(
        this.selectedEmploye.id,
        this.scannedCardId
      );
    } else {
      this.errorMessage = 'Veuillez scanner une carte RFID';
    }
  }

  resetAssignationForm(): void {
    this.scannedCardId = '';
    this.errorMessage = null;
    this.successMessage = null;
    const cardInput = document.getElementById('cardIdInput') as HTMLInputElement;
    if (cardInput) {
      cardInput.value = '';
    }
  }

  resetCardScan(): void {
    this.scannedCardId = '';
    const cardInput = document.getElementById('cardIdInput') as HTMLInputElement;
    if (cardInput) {
      cardInput.value = '';
    }
  }


  updateStatus(employe: Employe): void {
    if (!employe || !employe.id) {
      console.error('Employé ou ID non défini');
      alert('Erreur: Employé ou ID non défini');
      return;
    }

    this.departementService.toggleStatus(employe.id).subscribe({
      next: (response) => {
        console.log('Statut mis à jour avec succès:', response);
        this.loadEmployes();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut de l\'employé');
      }
    });
  }

  addEmploye(): void {
    if (this.employeForm.invalid) {
      this.employeForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.employeForm.get('nom')?.value);
    formData.append('prenom', this.employeForm.get('prenom')?.value);
    formData.append('email', this.employeForm.get('email')?.value);
    formData.append('telephone', this.employeForm.get('telephone')?.value);
    formData.append('adresse', this.employeForm.get('adresse')?.value);
    formData.append('fonction', this.employeForm.get('fonction')?.value);

    if (this.selectedPhoto) {
      formData.append('photo', this.selectedPhoto);
    }
    if (this.showPasswordField) {
      formData.append('password', this.employeForm.get('password')?.value);
    }

    this.departementService.getDepartementById(this.departementId).subscribe({
      next: departement => {
        const departementCode = departement.nom.substring(0, 3).toUpperCase();
        const nextMatricule = (this.employes.length + 1).toString().padStart(3, '0');
        const randomDigits = Math.floor(Math.random() * 90 + 10).toString();
        const matricule = `${departementCode}${nextMatricule}${randomDigits}`;

        formData.append('matricule', matricule);
        formData.append('departement_id', this.departementId);

        this.departementService.createEmploye(formData).subscribe({
          next: () => {
            console.log('Employé ajouté avec succès');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeModal'));
            modal?.hide();
            this.loadEmployes();
            this.apiErrors = {};
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout de l\'employé:', err);
            if (err.error && err.error.errors) {
              this.apiErrors = err.error.errors;
            } else {
              this.apiErrors = { general: ['Une erreur inconnue est survenue.'] };
            }
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des informations du département:', error);
        alert('Erreur lors de la récupération des informations du département');
      }
    });
  }

  updateEmploye(): void {
    if (this.employeForm.invalid || !this.selectedEmploye) {
      this.employeForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.employeForm.get('nom')?.value);
    formData.append('prenom', this.employeForm.get('prenom')?.value);
    formData.append('email', this.employeForm.get('email')?.value);
    formData.append('telephone', this.employeForm.get('telephone')?.value);
    formData.append('adresse', this.employeForm.get('adresse')?.value);
    formData.append('fonction', this.employeForm.get('fonction')?.value);

    if (this.selectedPhoto) {
      formData.append('photo', this.selectedPhoto);
    }
    if (this.showPasswordField) {
      formData.append('password', this.employeForm.get('password')?.value);
    }

    this.departementService.updateEmploye(this.selectedEmploye.id, formData).subscribe({
      next: () => {
        console.log('Employé modifié avec succès');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeModal'));
        modal?.hide();
        this.loadEmployes();
        this.selectedEmploye = null;
        this.selectedPhoto = null;
        this.employeForm.reset();
        this.apiErrors = {};
      },
      error: (err) => {
        console.error('Erreur lors de la modification de l\'employé:', err);
        if (err.error && err.error.errors) {
          this.apiErrors = err.error.errors;
        } else {
          this.apiErrors = { general: ['Une erreur inconnue est survenue.'] };
        }
      }
    });
  }

  getControl(controlName: string) {
    return this.employeForm.get(controlName);
  }
}