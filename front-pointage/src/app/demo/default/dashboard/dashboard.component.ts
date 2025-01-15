// Angular imports
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Cohorte } from '../../cohortes/cohorte.model';
import { DepartementService } from '../../../services/departement.service';
import { Departement } from '../../departements/departement.model';

// Project imports
import tableData from 'src/fake-data/default-data.json';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { MonthlyBarChartComponent } from './monthly-bar-chart/monthly-bar-chart.component';
import { IncomeOverviewChartComponent } from './income-overview-chart/income-overview-chart.component';


// Icons
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { Pointage } from 'src/app/services/getpointage.service';

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DefaultComponent implements OnInit {
  cohortesCount: number = 0;
  departementsCount: number = 0;


  countPresent: number = 0;
  countAbsent: number = 0;

  recentOrder = tableData;

  AnalyticEcommerce = [
    {
      title: 'Total Employers',
      amount: '0'
    },
    {
      title: 'Total Cohortes',
      amount: '0'
    },
    {
      title: 'Total Absence',
      amount: '0',

    },
    {
      title: 'Total Etudiants',
      amount: '300',

    },
    {
      title: 'Total Departements',
      amount: '0',

    }, {
      title: 'Total Presence',
      amount: '0',

    }
  ];
  employesCount: number;
  apprenantsCount: number;
   filteredPointages: Pointage[] = [];



  // Constructor with service injection
  constructor(private iconService: IconService, private apiService: ApiService,private departementService: DepartementService) {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }


  updateStatistics(): void {
    this.countPresent = this.filteredPointages.filter(p => p.estPresent && !p.estRetard).length;
    this.AnalyticEcommerce[5].amount = `${this.countPresent}`;


    this.countAbsent = this.filteredPointages.filter(p => !p.estPresent && !p.estRetard).length;
    this.AnalyticEcommerce[2].amount = `${this.countAbsent}`;

  }

  ngOnInit(): void {
    // Fetch the number of cohortes
    this.apiService.getCohortes().subscribe({
      next: (cohortes: Cohorte[]) => {
        this.cohortesCount = cohortes.length;
        this.AnalyticEcommerce[1].amount = `${this.cohortesCount}`; // Update the cohortes amount dynamically
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des cohortes :', err);
      }
    });

    // Fetch the number of departements
    this.departementService.getDepartements().subscribe({
      next: (departements: Departement[]) => {
        this.departementsCount = departements.length;
        // Dynamically update the "Total Departements" value
        this.AnalyticEcommerce[4].amount = `${this.departementsCount}`;  // Update "Total Departements" field
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des départements :', err);
      }
    });



    this.departementService.getEmployesCount().subscribe({
      next: (count) => {
        this.employesCount = count;
        this.AnalyticEcommerce[0].amount = `${this.employesCount}`;  // Update "Total Employers" field
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du nombre d\'employés:', err);
      }
    });




    this.apiService.getApprenantsCount().subscribe({
      next: (count) => {
        this.apprenantsCount = count;
        this.AnalyticEcommerce[3].amount = `${this.apprenantsCount}`;  // Update "Total Employers" field
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du nombre de apprenant:', err);
      }
    });




  }
}
