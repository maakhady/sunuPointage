import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

interface Apprenant {
  statut: any;
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matricule: string;
  adresse: string;
  cardId: string;
  cohorte_id: string;
  photo: string | null;
  role: string;
  type: string;
  cohorte: {
    id: string;
    nom: string;
    annee_scolaire: string;
    promo: number;

  } ;
  selected?: boolean;
}

@Component({
  selector: 'app-liste-apprenants',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './liste-apprenants.component.html',
  styleUrls: ['./liste-apprenants.component.scss']
})
export class ListeApprenantsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  apprenants: Apprenant[] = [];
  filteredApprenants: Apprenant[] = [];
  cohorteId: string = '';
  allSelected: boolean = false;
  searchQuery: string = '';
  apprenantForm: FormGroup;
  selectedPhoto: File | null = null;
  selectedApprenant: Apprenant | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  errorMessage: any;
  apiErrors: any;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  showPasswordField: boolean = false; // Pour afficher le champ mot de passe si nécessaire
  successMessage: string = '';


  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.apprenantForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required],
      photo: [null]
    });
  }

  ngOnInit(): void {
    // Initialisation du formulaire avec des validateurs
    this.apprenantForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      adresse: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]], // Format 10 chiffres
      photo: [null] // Aucun validateur pour l'instant
    });

    this.cohorteId = this.route.snapshot.params['id'];
    this.loadApprenants();

  }


  getControl(controlName: string) {
    return this.apprenantForm.get(controlName);
  }



  get totalPages(): number {
    return Math.ceil(this.filteredApprenants.length / this.itemsPerPage);
  }

  viewEmployeDetails(employe: Apprenant): void {
    this.router.navigate(['/sample-page', employe.id]);
  }

  loadApprenants(): void {
    this.apiService.getApprenantsByCohorte(this.cohorteId).subscribe({
      next: (response: any) => {
        this.apprenants = response.map((apprenant: any) => ({
          ...apprenant,
          selected: false
        }));
        this.filteredApprenants = this.apprenants;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des apprenants:', err);
      }
    });
  }

  onSearch(): void {
    this.filteredApprenants = this.apprenants.filter(apprenant =>
      apprenant.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      apprenant.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      apprenant.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      apprenant.matricule.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.currentPage = 1;
  }

  get paginatedApprenants(): Apprenant[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredApprenants.slice(startIndex, startIndex + this.itemsPerPage);
  }

  toggleSelectAll(): void {
    this.allSelected = !this.allSelected;
    this.apprenants.forEach(apprenant => apprenant.selected = this.allSelected);
  }

  onSelectionChange(): void {
    this.allSelected = this.apprenants.every(apprenant => apprenant.selected);
  }

  hasSelectedApprenants(): boolean {
    return this.apprenants.some(apprenant => apprenant.selected);
  }

  getSelectedApprenants(): Apprenant[] {
    return this.apprenants.filter(apprenant => apprenant.selected);
  }

  selectedItemsToDelete: any[] = [];

  onActionSelected(): void {
    const selectedApprenants = this.getSelectedApprenants();
    if (selectedApprenants.length === 0) {
      return;
    }
    this.selectedItemsToDelete = selectedApprenants;
    const modal = new bootstrap.Modal(document.getElementById('deleteMultipleModal'));
    modal.show();
  }

  confirmMultipleDelete(): void {
    if (this.selectedItemsToDelete.length > 0) {
      const deleteRequests = this.selectedItemsToDelete.map(apprenant =>
        this.apiService.deleteApprenant(apprenant.id)
      );
      forkJoin(deleteRequests).subscribe({
        next: () => {
          console.log('Apprenants supprimés avec succès');
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteMultipleModal'));
          modal?.hide();
          this.loadApprenants();
          this.allSelected = false;
          this.selectedItemsToDelete = [];
        },
        error: (err) => {
          console.error('Erreur lors de la suppression multiple:', err);
          alert('Erreur lors de la suppression des apprenants');
          this.selectedItemsToDelete = [];
        }
      });
    }
  }

  apprenantToDelete: any = null;

  deleteApprenant(id: string): void {
    const apprenant = this.apprenants.find(a => a.id === id);
    if (!apprenant) {
      alert('Apprenant non trouvé');
      return;
    }
    this.apprenantToDelete = apprenant;
    const modal = new bootstrap.Modal(document.getElementById('deleteApprenantModal'));
    modal.show();
  }




  confirmDelete(): void {
    if (this.apprenantToDelete) {
      this.apiService.deleteApprenant(this.apprenantToDelete.id).subscribe({
        next: () => {
          console.log('Apprenant supprimé avec succès');
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteApprenantModal'));
          modal?.hide();
          this.loadApprenants();
          this.apprenantToDelete = null;
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression de l\'apprenant');
          this.apprenantToDelete = null;
        }
      });
    }
  }



  openAddApprenantModal(): void {
    this.apprenantForm.reset();
    this.selectedPhoto = null;
    const modal = new bootstrap.Modal(document.getElementById('addApprenantModal'));
    modal.show();
  }



  openEditApprenantModal(apprenant: Apprenant): void {
    this.selectedApprenant = apprenant;
    this.apprenantForm.patchValue({
      nom: apprenant.nom,
      prenom: apprenant.prenom,
      email: apprenant.email,
      telephone: apprenant.telephone,
      adresse: apprenant.adresse
    });
    const modal = new bootstrap.Modal(document.getElementById('editApprenantModal'));
    modal.show();
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
    }
  }







  addApprenant(): void {
    if (this.apprenantForm.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.apprenantForm.get('nom')?.value);
    formData.append('prenom', this.apprenantForm.get('prenom')?.value);
    formData.append('email', this.apprenantForm.get('email')?.value);
    formData.append('telephone', this.apprenantForm.get('telephone')?.value);
    formData.append('adresse', this.apprenantForm.get('adresse')?.value);

    if (this.selectedPhoto) {
      formData.append('photo', this.selectedPhoto);
    }

    this.apiService.getCohorteById(this.cohorteId).subscribe({
      next: (cohorte) => {
        const cohorteCode = cohorte.nom.substring(0, 3).toUpperCase();
        const nextMatricule = (this.apprenants.length + 1).toString().padStart(3, '0');
        const randomDigits = Math.floor(Math.random() * 90 + 10).toString();
        const matricule = `${cohorteCode}${nextMatricule}${randomDigits}`;

        formData.append('matricule', matricule);
        formData.append('cohorte_id', this.cohorteId);

        this.apiService.createApprenant(formData).subscribe({
          next: (response) => {
            console.log('Apprenant ajouté avec succès');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addApprenantModal'));
            modal?.hide();
            this.loadApprenants();
            this.apiErrors = {};  // Réinitialiser les erreurs après un succès
          },
          error: (err) => {
            console.error('Erreur lors de l\'ajout de l\'apprenant:', err);
            // Vérifiez si l'API renvoie des erreurs spécifiques
            if (err.error && err.error.errors) {
              // Si des erreurs sont renvoyées, les assigner à `apiErrors`
              this.apiErrors = err.error.errors;
            } else {
              this.apiErrors = { general: ['Une erreur inconnue est survenue.'] };  // Message générique
            }
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des informations de la cohorte:', error);
        this.apiErrors = { general: ['Erreur lors de la récupération des informations de la cohorte.'] };  // Message cohorte
      }
    });
  }




  updateApprenantProfile(): void {
  if (this.apprenantForm.invalid || !this.selectedApprenant) {
    this.apprenantForm.markAllAsTouched();
    return;
  }

  // ✅ Vérifier si une photo est sélectionnée
  if (this.selectedPhoto) {
    console.log('=== MODIFICATION APPRENANT AVEC PHOTO ===');
    this.updateApprenantWithPhoto();
  } else {
    console.log('=== MODIFICATION APPRENANT SANS PHOTO ===');
    this.updateApprenantWithoutPhoto();
  }
}

// 🖼️ Méthode pour update AVEC photo (FormData)
private updateApprenantWithPhoto(): void {
  const formData = new FormData();
  
  // Ajouter tous les champs texte
  formData.append('nom', this.apprenantForm.get('nom')?.value?.trim() || '');
  formData.append('prenom', this.apprenantForm.get('prenom')?.value?.trim() || '');
  formData.append('email', this.apprenantForm.get('email')?.value?.trim() || '');
  formData.append('telephone', this.apprenantForm.get('telephone')?.value?.trim() || '');
  formData.append('adresse', this.apprenantForm.get('adresse')?.value?.trim() || '');
  
  // Champs spécifiques aux apprenants
  if (this.apprenantForm.get('cohorte_id')?.value) {
    formData.append('cohorte_id', this.apprenantForm.get('cohorte_id')?.value);
  }
  
  // Mot de passe si nécessaire
  if (this.showPasswordField && this.apprenantForm.get('password')?.value) {
    formData.append('password', this.apprenantForm.get('password')?.value);
  }
  
  // 🖼️ Ajouter la photo
  if (this.selectedPhoto) {
    formData.append('photo', this.selectedPhoto, this.selectedPhoto.name);
  }
  
  // 🔧 IMPORTANT: Ajouter _method=PUT pour Laravel
  formData.append('_method', 'PUT');
  
  console.log('=== DEBUG PHOTO APPRENANT ===');
  console.log('selectedPhoto:', this.selectedPhoto);
  console.log('selectedPhoto name:', this.selectedPhoto?.name);
  console.log('selectedPhoto size:', this.selectedPhoto?.size);
  console.log('selectedPhoto type:', this.selectedPhoto?.type);
  
  console.log('=== CONTENU FORMDATA APPRENANT ===');
  formData.forEach((value, key) => {
    if (value instanceof File) {
      console.log(`FormData ${key}:`, value, '(File object)');
    } else {
      console.log(`FormData ${key}:`, value);
    }
  });
  
  console.log('Envoi avec FormData (photo incluse) pour apprenant');
  
  // 🚀 Appel API avec FormData - CORRIGÉ: utiliser apiService au lieu de departementService
  this.apiService.updateApprenantWithPhoto(this.selectedApprenant!.id, formData).subscribe({
    next: (response) => {
      console.log('=== RÉPONSE SERVEUR APPRENANT COMPLÈTE ===');
      console.log('Response brute:', response);
      console.log('Response.photo:', response.photo);
      
      this.handleApprenantUpdateSuccess(response);
    },
    error: (err) => {
      console.error('❌ Erreur update apprenant avec photo:', err);
      this.handleApprenantUpdateError(err);
    }
  });
}

// 📝 Méthode pour update SANS photo (JSON)
private updateApprenantWithoutPhoto(): void {
  const apprenantData: any = {
    nom: this.apprenantForm.get('nom')?.value?.trim(),
    prenom: this.apprenantForm.get('prenom')?.value?.trim(),
    email: this.apprenantForm.get('email')?.value?.trim(),
    telephone: this.apprenantForm.get('telephone')?.value?.trim(),
    adresse: this.apprenantForm.get('adresse')?.value?.trim()
  };

  // Champs spécifiques aux apprenants
  if (this.apprenantForm.get('cohorte_id')?.value) {
    apprenantData.cohorte_id = this.apprenantForm.get('cohorte_id')?.value;
  }

  if (this.showPasswordField && this.apprenantForm.get('password')?.value) {
    apprenantData.password = this.apprenantForm.get('password')?.value;
  }
  
  console.log('Données JSON apprenant envoyées:', apprenantData);
  
  // 🚀 CORRIGÉ: utiliser apiService au lieu de departementService
  this.apiService.updateApprenant(this.selectedApprenant!.id, apprenantData).subscribe({
    next: (response) => {
      this.handleApprenantUpdateSuccess(response);
    },
    error: (err) => {
      this.handleApprenantUpdateError(err);
    }
  });
}

// 🎉 Gérer le succès pour apprenant
private handleApprenantUpdateSuccess(response: any): void {
  console.log('✅ Mise à jour apprenant réussie:', response);
  
  // Mettre à jour la liste locale
  const index = this.apprenants.findIndex(a => a.id === this.selectedApprenant!.id);
  if (index !== -1) {
    console.log('Apprenant AVANT mise à jour:', this.apprenants[index]);
    
    // Fusionner les nouvelles données
    this.apprenants[index] = { ...this.apprenants[index], ...response };
    
    console.log('Apprenant APRÈS mise à jour:', this.apprenants[index]);
    
    this.filteredApprenants = [...this.apprenants];
  }
  
  // Fermer modal et nettoyer
  const modal = bootstrap.Modal.getInstance(document.getElementById('editApprenantModal'));
  modal?.hide();
  this.selectedApprenant = null;
  this.selectedPhoto = null; // 🧹 Nettoyer la photo
  
  // Message de succès
  this.successMessage = 'Apprenant modifié avec succès';
  this.showSuccessMessage = true;
  setTimeout(() => this.showSuccessMessage = false, 3000);
}

// ❌ Gérer les erreurs pour apprenant
private handleApprenantUpdateError(err: any): void {
  console.error('❌ Erreur lors de la mise à jour apprenant:', err);
  
  if (err.error && err.error.errors) {
    this.apiErrors = err.error.errors;
  } else if (err.error && err.error.message) {
    this.errorMessage = err.error.message;
    this.showErrorMessage = true;
    setTimeout(() => {
      this.showErrorMessage = false;
      this.errorMessage = null;
    }, 5000);
  }
}


  isImporting: boolean = false;
  // showSuccessMessage: boolean = false;
  // successMessage: string = '';
  importSummary: { success: number, errors: string[] } = {
    success: 0,
    errors: []
  };






  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const formData = new FormData();
        formData.append('file', file);

        this.isImporting = true;
        this.showSuccessMessage = false;

        this.apiService.importApprenants(this.cohorteId, formData).subscribe({
          next: (response: any) => {
            this.importSummary = {
              success: response.data.imported.length,
              errors: response.data.errors
            };

            this.successMessage = `Importation réussie! ${this.importSummary.success} apprenant(s) importé(s)`;
            this.showSuccessMessage = true;
            this.loadApprenants();
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






  updateStatus(apprenant: Apprenant): void {
    if (!apprenant || !apprenant.id) {
      console.error('Apprenant ou ID non défini');
      alert('Erreur: Apprenant ou ID non défini');
      return;
    }

    this.apiService.toggleStatus(apprenant.id).subscribe({
      next: (response) => {
        console.log('Statut mis à jour avec succès:', response);
        // Recharger les données pour refléter le changement
        this.loadApprenants();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut de l\'apprenant');
      }
    });
  }








  assignCardId(apprenant: Apprenant): void {

    // Logique pour assigner un cardId à l'apprenant
    // Vous pouvez ouvrir un modal ou faire une requête API pour assigner le cardId
    console.log('Assigner cardId à l\'apprenant:', apprenant);

    // Exemple de modal pour assigner un cardId
    const modal = new bootstrap.Modal(document.getElementById('assignCardModal'));
    this.selectedApprenant = apprenant;
    modal.show();
  }








  confirmAssignCardId(): void {
    // Récupérer l'élément input contenant le Card ID
    const cardIdInput = (document.getElementById('cardIdInput') as HTMLInputElement)?.value;

    // Vérifier qu'un apprenant est sélectionné et qu'un Card ID est fourni
    if (this.selectedApprenant && cardIdInput) {
      // Appeler l'API pour assigner le Card ID à l'apprenant sélectionné
      this.apiService.assignCard(this.selectedApprenant.id, cardIdInput).subscribe({
        next: (response) => {
          console.log('Card ID assigné avec succès:', response);

          // Réinitialiser le message d'erreur
          this.errorMessage = null;

          // Fermer la modale Bootstrap
          const modal = bootstrap.Modal.getInstance(document.getElementById('assignCardModal'));
          modal?.hide();

          // Recharger la liste des apprenants
          this.loadApprenants();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'assignation du Card ID:', error);

          // Extraire le message d'erreur spécifique envoyé par l'API
          this.errorMessage = error?.error?.message || 'Une erreur est survenue lors de l\'assignation du Card ID.';
        }
      });
    } else {
      // Gérer les cas où il manque des informations
      if (!this.selectedApprenant) {
        this.errorMessage = 'Aucun apprenant sélectionné.';
      } else if (!cardIdInput) {
        this.errorMessage = 'Veuillez saisir un Card ID.';
      }
    }
  }


}


