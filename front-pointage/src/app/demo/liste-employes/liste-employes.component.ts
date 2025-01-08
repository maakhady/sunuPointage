import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartementService } from '../../services/departement.service';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
export class ListeEmployesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  employes: Employe[] = [];
  filteredEmployes: Employe[] = [];
  departementId: string = '';
  allSelected: boolean = false;
  isImporting: boolean = false;
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;





  employeForm: FormGroup;
  showPasswordField: boolean = false;
  selectedPhoto: File | null = null;
  selectedEmploye: Employe | null = null;







  // Properties for CSV import
  showSuccessMessage: boolean = false;
  successMessage: string = '';
  importSummary: {
    success: number;
    errors: string[];
  } | null = null;
  errorMessage: any;
  apiErrors: any;

  constructor(
    private route: ActivatedRoute,
    private departementService: DepartementService,
    private router: Router,
    private fb: FormBuilder,
    
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


  }

  get totalPages(): number {
    return Math.ceil(this.filteredEmployes.length / this.itemsPerPage);
  }

  viewEmployeDetails(employe: Employe): void {
    this.router.navigate(['/sample-page', employe.id]);
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

  downloadCSVTemplate(): void {
    const headers = [
      'nom',
      'prenom',
      'email',
      'password',
      'telephone',
      'type',
      'role',
      'adresse',
      'fonction',
      'matricule',
      'photo'
    ];

    const exampleData = [
      'Dupont,Jeane,jeane.dupont@email.com,password123,771234567,employe,administrateur,123 Rue Example,Développeur', 'INF0014',
      'Martine,Marie,marie.martine@email.com,password123,771234566,employe,administrateur,456 Avenue Test,Designer', 'INF0015'
    ];

    const csvContent = [
      headers.join(','),
      ...exampleData
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_employes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  onSearch(): void {
    this.filteredEmployes = this.employes.filter(employe =>
      employe.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      employe.matricule.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.currentPage = 1;
  }

  get paginatedEmployes(): Employe[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredEmployes.slice(startIndex, startIndex + this.itemsPerPage);
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

  selectedEmployesToDelete: any[] = [];

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

  employeToDelete: any = null;

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

    // Gérer l'affichage du champ mot de passe
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

    this.departementService.getDepartementById(this.departementId).subscribe(departement => {
      const departementCode = departement.nom.substring(0, 3).toUpperCase();
      const nextMatricule = (this.employes.length + 1).toString().padStart(3, '0');
      const randomDigits = Math.floor(Math.random() * 90 + 10).toString();
      const matricule = `${departementCode}${nextMatricule}${randomDigits}`;

      formData.append('matricule', matricule);
      formData.append('departement_id', this.departementId);

      this.departementService.createEmploye(formData).subscribe({
        next: (response) => {
          console.log('Employé ajouté avec succès');
          const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeModal'));
          modal?.hide();
          this.loadEmployes();
          this.apiErrors = {};  // Réinitialiser les erreurs après un succès
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout de l\'employé:', err);
          // Vérifiez si l'API renvoie des erreurs spécifiques
          if (err.error && err.error.errors) {
            // Si des erreurs sont renvoyées, les assigner à `apiErrors`
            this.apiErrors = err.error.errors;
          } else {
            this.apiErrors = { general: ['Une erreur inconnue est survenue.'] };  // Message générique
          }
        }
      });
    }, error => {
      console.error('Erreur lors de la récupération des informations du département:', error);
      alert('Erreur lors de la récupération des informations du département');
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
      next: (response) => {
        console.log('Employé modifié avec succès');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeModal'));
        modal?.hide();
        this.loadEmployes();
        this.selectedEmploye = null;
        this.selectedPhoto = null;
        this.employeForm.reset();
        this.apiErrors = {};  // Réinitialiser les erreurs après un succès
      },
      error: (err) => {
        console.error('Erreur lors de la modification de l\'employé:', err);
        // Vérifiez si l'API renvoie des erreurs spécifiques
        if (err.error && err.error.errors) {
          // Si des erreurs sont renvoyées, les assigner à `apiErrors`
          this.apiErrors = err.error.errors;
        } else {
          this.apiErrors = { general: ['Une erreur inconnue est survenue.'] };  // Message générique
        }
      }
    });
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
        // Recharger les données pour refléter le changement
        this.loadEmployes();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut de l\'employé');
      }
    });
  }

  assignCardId(employe: Employe): void {
    this.selectedEmploye = employe;
    const modal = new bootstrap.Modal(document.getElementById('assignCardModal'));
    modal.show();
  }

  confirmAssignCardId(): void {
    const cardIdInput = (document.getElementById('cardIdInput') as HTMLInputElement)?.value;
    if (this.selectedEmploye && cardIdInput) {
      this.departementService.assignCard(this.selectedEmploye.id, cardIdInput).subscribe({
        next: (response) => {
          console.log('Card ID assigné avec succès:', response);
          this.errorMessage = null;
          const modal = bootstrap.Modal.getInstance(document.getElementById('assignCardModal'));
          modal?.hide();
          this.loadEmployes();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'assignation du Card ID:', error);
          this.errorMessage = error?.error?.message || 'Une erreur est survenue lors de l\'assignation du Card ID.';
        }
      });
    } else {
      if (!this.selectedEmploye) {
        this.errorMessage = 'Aucun employé sélectionné.';
      } else if (!cardIdInput) {
        this.errorMessage = 'Veuillez saisir un Card ID.';
      }
    }
  }

  getControl(controlName: string) {
    return this.employeForm.get(controlName);
  }
}
