import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DepartementService } from '../../services/departement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

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
  selector: 'app-liste-employes',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
 

  constructor(
    private route: ActivatedRoute, 
    private departementService: DepartementService,
    private router: Router 
  ) {}

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


//Reire la fassons de recuperer les donnees
  loadEmployes(): void {
    this.departementService.getEmployesByDepartement(this.departementId).subscribe({
      next: (response: any) => {
        // Vérification si response est un tableau
        const employesData = Array.isArray(response) ? response : [];
        
        this.employes = employesData.map((employe: any) => ({
          id: employe.id || '',
          nom: employe.nom || '',
          prenom: employe.prenom || '',
          email: employe.email || '',
          telephone: employe.telephone || '',
          matricule: employe.matricule || '',
          adresse: employe.adresse || '',
          fonction: employe.fonction || '',
          departement_id: employe.departement_id || '',
          photo: employe.photo || null,
          status: employe.status || '',
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
      employe.email.toLowerCase().includes(this.searchQuery.toLowerCase())
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



onActionSelected(): void {
  const selectedEmployes = this.getSelectedEmployes();
  if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedEmployes.length} employé(s) ?`)) {
    // Utiliser forkJoin pour gérer plusieurs suppressions en parallèle
    const deleteRequests = selectedEmployes.map(employe => 
      this.departementService.deleteEmploye(employe.id)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        console.log('Employés supprimés avec succès');
        this.loadEmployes();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression multiple:', err);
        // Vous pouvez ajouter une notification d'erreur ici
      }
    });
  }
}










  editEmploye(employe: Employe): void {
    console.log('Éditer employé:', employe);
    // Implémenter la logique d'édition
  }

  // Dans liste-employes.component.ts
deleteEmploye(id: string): void {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
    this.departementService.deleteEmploye(id).subscribe({
      next: (response) => {
        console.log('Employé supprimé avec succès');
        // Rafraîchir la liste après suppression
        this.loadEmployes();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        // Vous pouvez ajouter une notification d'erreur ici
      }
    });
  }
}
}