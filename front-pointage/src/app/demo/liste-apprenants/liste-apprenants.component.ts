import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

interface Apprenant {
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
  selected?: boolean;
}

@Component({
  selector: 'app-liste-apprenants',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './liste-apprenants.component.html',
  styleUrls: ['./liste-apprenants.component.scss']
})
export class ListeApprenantsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  apprenants: Apprenant[] = [];
  filteredApprenants: Apprenant[] = [];
  cohorteId: string = '';
  allSelected: boolean = false;
  isImporting: boolean = false;
  searchQuery: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    this.cohorteId = this.route.snapshot.params['id'];
    this.loadApprenants();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApprenants.length / this.itemsPerPage);
  } 

  
  loadApprenants(): void {
    this.apiService.getApprenantsByCohorte(this.cohorteId).subscribe({
      next: (response: any) => {
        this.apprenants = response.map((apprenant: any) => ({
          ...apprenant,
          selected: false
        }));
        this.filteredApprenants = this.apprenants; // Initialiser avec tous les apprenants
      },
      error: (err) => {
        console.error('Erreur lors du chargement des apprenants:', err);
      }
    });
  }

  // Méthode pour gérer l'import CSV
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      this.isImporting = true;
      this.apiService.importApprenants(this.cohorteId, formData).subscribe({
        next: (response) => {
          console.log('Import réussi:', response);
          this.loadApprenants();
          this.fileInput.nativeElement.value = '';
          this.isImporting = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'import:', error);
          this.isImporting = false;
          this.fileInput.nativeElement.value = '';
        }
      });
    } else {
      alert('Veuillez sélectionner un fichier CSV valide');
      this.fileInput.nativeElement.value = '';
    }
  }

  // Rechercher des apprenants
  onSearch(): void {
    this.filteredApprenants = this.apprenants.filter(apprenant =>
      apprenant.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      apprenant.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      apprenant.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.currentPage = 1; // Réinitialiser à la première page
  }

  // Pagination
  get paginatedApprenants(): Apprenant[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredApprenants.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Méthodes existantes pour la gestion de la sélection
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



  // Modifier la méthode de suppression multiple
onActionSelected(): void {
  const selectedApprenants = this.getSelectedApprenants();
  
  if (selectedApprenants.length === 0) {
    return;
  }

  if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedApprenants.length} apprenant(s) ?`)) {
    // Créer un tableau de requêtes de suppression
    const deleteRequests = selectedApprenants.map(apprenant => 
      this.apiService.deleteApprenant(apprenant.id)
    );

    // Exécuter toutes les suppressions en parallèle
    forkJoin(deleteRequests).subscribe({
      next: () => {
        console.log('Apprenants supprimés avec succès');
        // Recharger la liste après les suppressions
        this.loadApprenants();
        // Réinitialiser la sélection
        this.allSelected = false;
      },
      error: (err) => {
        console.error('Erreur lors de la suppression multiple:', err);
        alert('Erreur lors de la suppression des apprenants');
      }
    });
  }
}










// Modifier la méthode de suppression individuelle
deleteApprenant(id: string): void {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
    this.apiService.deleteApprenant(id).subscribe({
      next: () => {
        console.log('Apprenant supprimé avec succès');
        // Recharger la liste après la suppression
        this.loadApprenants();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression de l\'apprenant');
      }
    });
  }
}

  editApprenant(apprenant: Apprenant): void {
    console.log('Éditer apprenant:', apprenant);
  }


}