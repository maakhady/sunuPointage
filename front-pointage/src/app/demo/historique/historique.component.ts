import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import tableData from 'src/fake-data/default-data.json';
import { SharedModule } from 'src/app/theme/shared/shared.module';

// icons
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { ApiService, Pointage } from 'src/app/services/api.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule,
    SharedModule],
  templateUrl: './historique.component.html',
  styleUrl: './historique.component.scss'
})
export class HistoriqueComponent implements OnInit {
  pointages: Pointage[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  searchQuery: any;
  filteredPointages: Pointage[];
  recentOrder = tableData;

  AnalyticEcommerce = [
    {
      title: 'Total Absence',
      background: 'bg-light-info ',
      border: 'border-info',
      percentage: '27',
      color: 'text-warning',
    },
    {
      title: 'Total Presence',
      background: 'bg-light-info ',
      border: 'border-info',
      percentage: '100',
      color: 'text-warning',
    }
  ];

  constructor(private iconService: IconService, private apiService: ApiService) {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }

  ngOnInit(): void {
    this.loadPointages();
  }

  onSearch(): void {
    this.filteredPointages = this.pointages.filter(pointage =>
      pointage.utilisateur.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      pointage.utilisateur.prenom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      pointage.utilisateur.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.currentPage = 1;
  }

  loadPointages() {
    this.apiService.getPointages().subscribe({
      next: (data) => {
        this.pointages = data;
        console.log('Pointages chargés:', this.pointages);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pointages:', error);
      }
    });
  }

  paginatedPointages(): Pointage[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.pointages.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.pointages.length / this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  loadPointagesForUser(userId: string) {
    this.apiService.getPointagesByUser(userId).subscribe({
      next: (data) => {
        this.pointages = data;
      },
      error: (error) => {
        console.error('Erreur:', error);
      }
    });
  }
}
