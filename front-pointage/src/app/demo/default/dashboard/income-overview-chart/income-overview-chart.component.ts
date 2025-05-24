// src/app/components/pointage-overview-chart/pointage-overview-chart.component.ts

import { Component, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

// services
import { 
  PointageChartService, 
  GraphiqueFilters, 
  GraphiquePresenceData 
} from 'src/app/services/pointage-chart.service';

// third party
import {
  NgApexchartsModule,
  ChartComponent,
  ApexChart,
  ApexAxisChartSeries,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ApexTooltip
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  colors: string[];
  stroke: ApexStroke;
  grid: ApexGrid;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
};

export type ChartViewType = 'presence' | 'retards' | 'absences' | 'all';

@Component({
  selector: 'app-income-overview-chart',
  standalone: true,
  imports: [SharedModule, NgApexchartsModule],
  templateUrl: './income-overview-chart.component.html',
  styleUrl: './income-overview-chart.component.scss'
})
export class IncomeOverviewChartComponent implements OnInit, OnDestroy {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  @Input() viewType: ChartViewType = 'presence';
  @Input() period: 'week' | 'month' = 'week';
  @Input() height: number = 365;
  @Input() showDataLabels: boolean = false;

  chartOptions!: Partial<ChartOptions>;
  
  // loading and data states
  isLoading = false;
  errorMessage = '';
  noData = false;

  // filters
  filters: GraphiqueFilters = {
    debut: '',
    fin: ''
  };

  // summary stats
  totalPresents = 0;
  totalRetards = 0;
  totalAbsents = 0;
  tauxPresence = 0;

  // subscription management
  private destroy$ = new Subject<void>();

  constructor(private pointageChartService: PointageChartService) {}

  ngOnInit() {
    this.initializeChart();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser la configuration du graphique
   */
  private initializeChart(): void {
    this.chartOptions = {
      chart: {
        type: 'bar',
        height: this.height,
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          columnWidth: '45%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: this.showDataLabels,
        style: {
          colors: ['#fff'],
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      series: [
        {
          name: 'Présents',
          data: []
        }
      ],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: [],
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: ['#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c']
          }
        }
      },
      yaxis: {
        show: false
      },
      colors: this.getColors(),
      grid: {
        show: false
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value: number) => {
            return `${value} personnes`;
          }
        }
      }
    };
  }

  /**
   * Charger les données
   */
  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noData = false;
    
    // Générer les dates selon la période
    const dateRange = this.pointageChartService.generateDateRange(this.period);
    this.filters = {
      ...this.filters,
      ...dateRange
    };

    console.log('🔍 Chargement des données pour:', {
      periode: this.period,
      filters: this.filters
    });

    this.pointageChartService.getGraphiquePresencesParJour(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: GraphiquePresenceData) => {
          console.log('📊 Données reçues:', response);
          
          if (response.status && response.data) {
            this.updateChart(response.data);
            this.calculateStats(response.data);
          } else {
            this.noData = true;
            this.errorMessage = 'Aucune donnée disponible pour cette période';
            this.setEmptyChart();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données:', error);
          this.errorMessage = 'Erreur lors du chargement des données';
          this.setEmptyChart();
        }
      });
  }

  /**
   * Mettre à jour le graphique avec les données
   */
  private updateChart(data: any): void {
    console.log('🔄 Mise à jour du graphique avec:', data);

    // Extraire les labels (jours)
    const labels = data.labels || [];
    
    // Extraire les datasets
    const datasets = data.datasets || [];
    const presentsData = datasets.find((d: any) => d.label === 'Présents')?.data || [];
    const retardsData = datasets.find((d: any) => d.label === 'En retard')?.data || [];
    const absentsData = datasets.find((d: any) => d.label === 'Absents')?.data || [];

    // Configurer les séries selon le type de vue
    let series: ApexAxisChartSeries = [];
    let colors: string[] = [];

    switch (this.viewType) {
      case 'presence':
        series = [
          {
            name: 'Présents',
            data: presentsData
          }
        ];
        colors = ['#22c55e']; // Vert
        break;

      case 'retards':
        series = [
          {
            name: 'En retard',
            data: retardsData
          }
        ];
        colors = ['#f59e0b']; // Orange
        break;

      case 'absences':
        series = [
          {
            name: 'Absents',
            data: absentsData
          }
        ];
        colors = ['#ef4444']; // Rouge
        break;

      case 'all':
        series = [
          {
            name: 'Présents',
            data: presentsData
          },
          {
            name: 'En retard',
            data: retardsData
          },
          {
            name: 'Absents',
            data: absentsData
          }
        ];
        colors = ['#22c55e', '#f59e0b', '#ef4444'];
        break;
    }

    // Mettre à jour le graphique
    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      colors: colors,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: labels
      }
    };

    console.log('✅ Graphique mis à jour avec les séries:', series);
  }

  /**
   * Calculer les statistiques de résumé
   */
  private calculateStats(data: any): void {
    const datasets = data.datasets || [];
    const presentsData = datasets.find((d: any) => d.label === 'Présents')?.data || [];
    const retardsData = datasets.find((d: any) => d.label === 'En retard')?.data || [];
    const absentsData = datasets.find((d: any) => d.label === 'Absents')?.data || [];

    // Calculer les totaux
    this.totalPresents = presentsData.reduce((sum: number, val: number) => sum + val, 0);
    this.totalRetards = retardsData.reduce((sum: number, val: number) => sum + val, 0);
    this.totalAbsents = absentsData.reduce((sum: number, val: number) => sum + val, 0);

    // Calculer le taux de présence
    const total = this.totalPresents + this.totalRetards + this.totalAbsents;
    this.tauxPresence = total > 0 ? 
      Math.round(((this.totalPresents + this.totalRetards) / total) * 100) : 0;

    console.log('📈 Statistiques calculées:', {
      totalPresents: this.totalPresents,
      totalRetards: this.totalRetards,
      totalAbsents: this.totalAbsents,
      tauxPresence: this.tauxPresence
    });
  }

  /**
   * Obtenir les couleurs selon le type de vue
   */
  private getColors(): string[] {
    const colorMap = {
      presence: ['#22c55e'],              // Vert
      retards: ['#f59e0b'],               // Orange
      absences: ['#ef4444'],              // Rouge
      all: ['#22c55e', '#f59e0b', '#ef4444'] // Vert, Orange, Rouge
    };
    return colorMap[this.viewType];
  }

  /**
   * Définir un graphique vide
   */
  private setEmptyChart(): void {
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Aucune donnée',
        data: []
      }],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: []
      }
    };

    // Reset des stats
    this.totalPresents = 0;
    this.totalRetards = 0;
    this.totalAbsents = 0;
    this.tauxPresence = 0;
  }

  /**
   * Changer le type de vue
   */
  changeViewType(newType: ChartViewType): void {
    if (this.viewType !== newType) {
      this.viewType = newType;
      this.chartOptions.colors = this.getColors();
      this.loadData();
    }
  }

  /**
   * Changer la période
   */
  changePeriod(newPeriod: 'week' | 'month'): void {
    if (this.period !== newPeriod) {
      this.period = newPeriod;
      this.loadData();
    }
  }

  /**
   * Actualiser les données
   */
  refresh(): void {
    this.loadData();
  }

  /**
   * Obtenir le titre selon le type de vue
   */
  getChartTitle(): string {
    const titles = {
      presence: 'Vue d\'ensemble des Présences',
      retards: 'Évolution des Retards',
      absences: 'Suivi des Absences',
      all: 'Résumé Complet des Pointages'
    };
    return titles[this.viewType];
  }

  /**
   * Obtenir la description selon le type de vue
   */
  getChartDescription(): string {
    const descriptions = {
      presence: `${this.totalPresents} personnes présentes`,
      retards: `${this.totalRetards} retards enregistrés`,
      absences: `${this.totalAbsents} absences comptabilisées`,
      all: `Taux de présence: ${this.tauxPresence}%`
    };
    return descriptions[this.viewType];
  }

  /**
   * Obtenir l'icône selon le type de vue
   */
  getChartIcon(): string {
    const icons = {
      presence: 'fas fa-users text-success',
      retards: 'fas fa-clock text-warning',
      absences: 'fas fa-user-times text-danger',
      all: 'fas fa-chart-bar text-primary'
    };
    return icons[this.viewType];
  }
}