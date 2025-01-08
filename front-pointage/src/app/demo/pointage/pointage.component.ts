import { Component, OnInit, OnDestroy } from '@angular/core';
import { GetpointageService, Pointage } from '../../services/getpointage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './pointage.component.html',
  styleUrls: ['./pointage.component.scss']
})
export class PointageComponent implements OnInit, OnDestroy {
  // États du composant
  stats = {
    total_utilisateurs: 0,
    presents: 0,
    absents: 0,
    retards: 0,
    pourcentage_presence: 0
  };

  pointages: Pointage[] = [];
  loading = false;
  error: string | null = null;

  // Filtres et pagination
  selectedType: 'tous' | 'apprenant' | 'employe' = 'tous';
  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 10;
  selectedDate: string = new Date().toISOString().split('T')[0];

  private destroy$ = new Subject<void>();

  constructor(private getpointageService: GetpointageService) {}

  ngOnInit() {
    this.loadPointages();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoRefresh() {
    const refreshInterval = setInterval(() => {
      if (!this.destroy$.closed) {
        this.loadPointages();
      } else {
        clearInterval(refreshInterval);
      }
    }, 60000);
  }

  loadPointages() {
    this.loading = true;
    this.error = null;
    console.log('Début chargement des pointages...');

    this.getpointageService.getAllPointages({
      date: this.selectedDate
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Réponse reçue:', response);
        if (response.status) {
          this.pointages = response.data;
          console.log('Pointages chargés:', this.pointages);

          if (response.statistiques) {
            this.stats = response.statistiques;
            console.log('Statistiques:', this.stats);
          } else {
            this.calculateStats();
          }
        } else {
          this.error = 'Erreur: ' + (response.message || 'Erreur lors du chargement des données');
          console.error('Erreur status false:', response);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error('Erreur API:', err);
      },
      complete: () => {
        this.loading = false;
        console.log('Chargement terminé');
      }
    });
  }

  private calculateStats() {
    const filtered = this.filteredPointages;
    this.stats = {
      total_utilisateurs: filtered.length,
      presents: filtered.filter(p => p.estPresent && !p.estRetard).length,
      retards: filtered.filter(p => p.estRetard).length,
      absents: filtered.filter(p => !p.estPresent).length,
      pourcentage_presence: filtered.length > 0
        ? Math.round((filtered.filter(p => p.estPresent).length / filtered.length) * 100)
        : 0
    };
  }

  get filteredPointages(): Pointage[] {
    let filtered = [...this.pointages];

    if (this.searchQuery) {
      const search = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        if (!p || !p.utilisateur) return false;  // Déjà correct ici

        const nom = p.utilisateur.nom ? p.utilisateur.nom.toLowerCase() : '';
        const prenom = p.utilisateur.prenom ? p.utilisateur.prenom.toLowerCase() : '';
        const type = p.utilisateur.type ? p.utilisateur.type.toLowerCase() : '';

        return nom.includes(search) ||
               prenom.includes(search) ||
               type.includes(search);
      });
    }

    if (this.selectedType !== 'tous') {
      filtered = filtered.filter(p => {
        if (!p || !p.utilisateur || !p.utilisateur.type) return false;
        return p.utilisateur.type.toLowerCase() === this.selectedType;
      });
    }

    return filtered;
  }

  get paginatedPointages(): Pointage[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPointages.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPointages.length / this.itemsPerPage);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onFilterChange(type: 'tous' | 'apprenant' | 'employe') {
    this.selectedType = type;
    this.currentPage = 1;
    this.calculateStats();
  }

  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    this.currentPage = 1;
    this.loadPointages();
  }

  formatTime(date: string | null): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  getStatusClass(pointage: Pointage): string {
    if (!pointage) return 'bg-secondary';
    if (pointage.estPresent && !pointage.estRetard) {
      return 'bg-success';
    } else if (pointage.estRetard) {
      return 'bg-warning';
    }
    return 'bg-danger';
  }

  getStatusText(pointage: Pointage): string {
    if (!pointage) return 'N/A';
    if (pointage.estPresent && !pointage.estRetard) {
      return 'Présent';
    } else if (pointage.estRetard) {
      return 'Retard';
    }
    return 'Absent';
  }





  // Méthode pour modifier un pointage
  modifierPointage(id: string, data: {
    premierPointage?: string;
    dernierPointage?: string;
    estPresent?: boolean;
    estRetard?: boolean;
  }) {
    this.loading = true;
    this.error = null;

    this.getpointageService.modifierPointage(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status) {
            this.loadPointages();
          } else {
            this.error = 'Erreur: ' + (response.message || 'Erreur lors de la modification du pointage');
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors de la modification du pointage';
          this.loading = false;
          console.error('Erreur API:', err);
        }
      });
  }




}
