// src/app/components/monthly-bar-chart/monthly-bar-chart.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

// services
import { 
  PointageChartService, 
  GraphiqueFilters, 
  GraphiquePresenceData 
} from 'src/app/services/pointage-chart.service';

// third party import
import {
  NgApexchartsModule,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexAxisChartSeries,
  ApexStroke,
  ApexXAxis,
  ApexYAxis,
  ApexTheme,
  ApexGrid,
  ApexLegend,
  ApexTooltip
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  colors: string[];
  stroke: ApexStroke;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  theme: ApexTheme;
  legend: ApexLegend;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-monthly-bar-chart',
  standalone: true,
  imports: [SharedModule, NgApexchartsModule],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnInit, OnDestroy {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  chartOptions!: Partial<ChartOptions>;
  
  // loading and error states
  isLoading = false;
  errorMessage = '';
  
  // filters
  currentPeriod: 'week' | 'month' = 'week';
  filters: GraphiqueFilters = {
    debut: '',
    fin: ''
  };

  // subscription management
  private destroy$ = new Subject<void>();

  constructor(private pointageChartService: PointageChartService) {}

  // life cycle hook
  ngOnInit() {
    this.initializeChart();
    this.loadChartData(this.currentPeriod);
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
        height: 450,
        type: 'area',
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#22c55e', '#f59e0b', '#ef4444'], // Vert, Orange, Rouge
      series: [],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: [
              '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c',
              '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c',
              '#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c'
            ]
          }
        },
        axisBorder: {
          show: true,
          color: '#f0f0f0'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#8c8c8c']
          }
        },
        title: {
          text: 'Nombre de personnes',
          style: {
            color: '#8c8c8c'
          }
        }
      },
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      theme: {
        mode: 'light'
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right'
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function(val: number) {
            return val + ' personnes';
          }
        }
      }
    };
  }

  /**
   * Charger les données du graphique
   */
  private loadChartData(period: 'week' | 'month'): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Générer les dates selon la période
    const dateRange = this.pointageChartService.generateDateRange(period);
    this.filters = {
      ...this.filters,
      ...dateRange
    };

    console.log('🔍 Chargement des données pour:', {
      periode: period,
      filters: this.filters
    });

    this.pointageChartService.getGraphiquePresencesParJour(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: GraphiquePresenceData) => {
          console.log('✅ Données reçues:', response);
          if (response.status && response.data) {
            this.updateChart(response.data);
          } else {
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
   * Mettre à jour le graphique avec les nouvelles données
   */
  private updateChart(data: any): void {
    // Mettre à jour les séries
    this.chartOptions.series = data.datasets.map((dataset: any) => ({
      name: dataset.label,
      data: dataset.data
    }));

    // Mettre à jour les catégories (axes X)
    const xaxis = { ...this.chartOptions.xaxis };
    xaxis.categories = data.labels;
    this.chartOptions = { ...this.chartOptions, xaxis };

    console.log('📊 Graphique mis à jour:', {
      series: this.chartOptions.series,
      categories: data.labels
    });
  }

  /**
   * Définir un graphique vide en cas d'erreur
   */
  private setEmptyChart(): void {
    this.chartOptions.series = [
      { name: 'Présents', data: [] },
      { name: 'En retard', data: [] },
      { name: 'Absents', data: [] }
    ];
    
    const xaxis = { ...this.chartOptions.xaxis };
    xaxis.categories = [];
    this.chartOptions = { ...this.chartOptions, xaxis };
  }

  /**
   * Basculer entre les périodes (semaine/mois)
   */
  toggleActive(value: 'month' | 'week'): void {
    if (this.isLoading) return; // Empêcher les clics multiples pendant le chargement

    this.currentPeriod = value;
    
    // Mettre à jour les classes CSS
    if (value === 'month') {
      document.querySelector('.chart-income.month')?.classList.add('active');
      document.querySelector('.chart-income.week')?.classList.remove('active');
    } else {
      document.querySelector('.chart-income.week')?.classList.add('active');
      document.querySelector('.chart-income.month')?.classList.remove('active');
    }

    // Charger les nouvelles données
    this.loadChartData(value);
  }

  /**
   * Appliquer des filtres personnalisés
   */
  applyFilters(newFilters: Partial<GraphiqueFilters>): void {
    this.filters = { ...this.filters, ...newFilters };
    this.loadChartData(this.currentPeriod);
  }

  /**
   * Recharger les données
   */
  refreshData(): void {
    this.loadChartData(this.currentPeriod);
  }



  /**
 * Calculer le total d'une série spécifique
 */
getTotalFromSeries(seriesName: string): number {
  if (!this.chartOptions.series) return 0;
  
  const series = this.chartOptions.series.find(s => s.name === seriesName);
  if (!series || !Array.isArray(series.data)) return 0;
  
  return series.data.reduce((total: number, value: any) => {
    const num = typeof value === 'number' ? value : (value?.y || 0);
    return total + num;
  }, 0);
}

/**
 * Obtenir le pourcentage de présence
 */
getPresencePercentage(): number {
  const presents = this.getTotalFromSeries('Présents');
  const retards = this.getTotalFromSeries('En retard');
  const absents = this.getTotalFromSeries('Absents');
  const total = presents + retards + absents;
  
  return total > 0 ? Math.round(((presents + retards) / total) * 100) : 0;
}

/**
 * Exporter les données du graphique
 */
exportChartData(): void {
  if (!this.chartOptions.series || !this.chartOptions.xaxis?.categories) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  const data = {
    periode: this.currentPeriod,
    dates: this.chartOptions.xaxis.categories,
    series: this.chartOptions.series.map(s => ({
      name: s.name,
      data: s.data
    })),
    statistiques: {
      total_presents: this.getTotalFromSeries('Présents'),
      total_retards: this.getTotalFromSeries('En retard'),
      total_absents: this.getTotalFromSeries('Absents'),
      pourcentage_presence: this.getPresencePercentage()
    },
    filters: this.filters,
    generated_at: new Date().toISOString()
  };

  // Créer et télécharger le fichier JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pointages-${this.currentPeriod}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// /**
//  * Imprimer le graphique
//  */
// printChart(): void {
//   if (this.chart && this.chart.chart) {
//     this.chart.chart.print();
//   }
// }
}