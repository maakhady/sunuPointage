import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, } from 'rxjs';
import { PointageService } from '../../services/pointage.service';
import { UtilisateurPresence, DernierPointage, } from '../pointage/pointage.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarComponent } from '../../../app/theme/layouts/admin-layout/nav-bar/nav-bar.component';
import { AuthService } from '../../services/Service1/auth.service';

interface NouveauPointage {
  cardId: string;         // Changé de pointageId à cardId
  matricule: string;
  nom: string;
  prenom: string;
  photo?: string;
  fonction?: string;
}

@Component({
  selector: 'app-dashboard-vigile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavBarComponent
  ],
  templateUrl: './dashboard-vigile.component.html',
  styleUrls: ['./dashboard-vigile.component.scss']
})
export class DashboardVigileComponent implements OnInit, OnDestroy {
  // États UI
  currentDate: Date = new Date();
  doorStatus: 'open' | 'closed' = 'closed';
  loading: boolean = true;
  error: string | null = null;
  showReconnectingMessage: boolean = false;
  isSocketConnected: boolean = false;
  cardError: {cardId: string, message: string, code: number} | null = null;


  // Navigation
  navCollapsed: boolean = false;
  navCollapsedMob: boolean = false;

  // États des données
  nouveauPointage: NouveauPointage | null = null;
  derniersPointages: DernierPointage[] = [];
  utilisateurs: UtilisateurPresence[] = [];

  // Pagination et recherche
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6;

    // Modifier la propriété doorStatus existante
    doorCommand: 'OPEN' | 'CLOSE' = 'CLOSE';

  private subscriptions: Subscription[] = [];

  constructor(private pointageService: PointageService,
    private authService: AuthService

  ) {
     // Mise à jour de l'heure
     setInterval(() => {
      this.currentDate = new Date();
    }, 1000);

    this.subscriptions.push(
      this.pointageService.cardError$.subscribe(error => {
        if (error) {
          this.cardError = error;
          // Empêcher le défilement de la page
          document.body.style.overflow = 'hidden';

          // Fermeture automatique après 5 secondes
          setTimeout(() => {
            this.closeCardError();
          }, 5000);
        }
      })
    );

  }

  ngOnInit(): void {
    this.initializeComponent();
    console.log('État de la connexion socket :', this.isSocketConnected);

  }

  private initializeComponent(): void {
    // D'abord écouter les changements de statut de la connexion socket
    this.subscriptions.push(
      this.pointageService.getSocketConnectionStatus().subscribe(
        (connected) => {
          console.log('État de la connexion socket :', connected);
          this.isSocketConnected = connected;
        }
      )
    );

    // État de la connexion socket
    this.isSocketConnected = this.pointageService.isConnected();

    // Souscriptions aux événements socket
    this.subscribeToSocketEvents();

    // Chargement initial des données
    this.loadData();
  }

  private subscribeToSocketEvents(): void {
    this.subscriptions.push(
      this.pointageService.getCurrentPointage().subscribe(pointage => {
        console.log('Nouveau pointage reçu:', pointage);
        if (!pointage || !pointage.utilisateur) return;

        this.nouveauPointage = {
          cardId: pointage.cardId,     // Utilisation du cardId comme identifiant principal
          matricule: pointage.utilisateur.matricule,
          nom: pointage.utilisateur.nom || '',
          prenom: pointage.utilisateur.prenom || '',
          photo: pointage.utilisateur.photo,
          fonction: pointage.utilisateur.fonction
        };

        console.log('NouveauPointage créé:', this.nouveauPointage);
        this.loadDerniersPointages();
      })
    );

    // Souscription au statut de la porte
    this.subscriptions.push(
      this.pointageService.getDoorStatus().subscribe(
        (response: { status: boolean, command: 'OPEN' | 'CLOSE' }) => {
          console.log('Statut porte reçu:', response);
          if (response.status) {
            this.doorCommand = response.command;
          }
        },
        error => {
          console.error('Erreur sur le statut de la porte:', error);
          this.error = "Erreur lors de la mise à jour du statut de la porte";
        }
      )
    );

    // Écoute des erreurs de connexion
    this.subscriptions.push(
      this.pointageService.getSocketConnectionStatus().subscribe(
        connected => {
          this.isSocketConnected = connected;
          this.showReconnectingMessage = !connected;
          if (!connected) {
            console.log('Connexion socket perdue');
          }
        }
      )
    );
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      const vigileInfo = await this.authService.isVigile().toPromise();
      if (!vigileInfo?.isVigile) {
        throw new Error("Accès non autorisé - Rôle vigile requis");
      }

      await Promise.all([
        this.loadUtilisateurs(),
        this.loadDerniersPointages()
      ]);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      this.error = err instanceof Error ? err.message : "Erreur lors du chargement des données";
    } finally {
      this.loading = false;
    }
  }




  private async loadUtilisateurs(): Promise<void> {
    try {
      const response = await this.pointageService.getAllUtilisateursActifs().toPromise();
      console.log('Response complète:', response); // Pour voir la structure complète

      if (response?.status) {
        this.utilisateurs = response.data.map(user => {
          console.log('User data:', user); // Pour voir la structure de chaque utilisateur
          return {
            matricule: user.matricule || '',
            photo: user.photo || 'assets/images/user/avatar-1.jpg',
            nom: user.nom || '',
            prenom: user.prenom || '',
            type: user.type || '',
            status: this.determinerStatus({
              estPresent: user.estPresent ?? false,
              estRetard: user.estRetard ?? false,
              estEnAttente: user.estEnAttente ?? false
            }),
            entree: user.premierPointage ?
                   new Date(user.premierPointage).toLocaleTimeString() : '-',
            sortie: user.dernierPointage ?
                   new Date(user.dernierPointage).toLocaleTimeString() : '-',
            cardId: user.cardId || ''
          };
        });
      }
    } catch (err) {
      console.error('Erreur détaillée loadUtilisateurs:', err);
      this.error = "Erreur lors du chargement des utilisateurs";
    }
  }

  private determinerStatus(pointage: {
    estPresent: boolean;
    estRetard: boolean;
    estEnAttente: boolean;
  }): 'Présent' | 'Absent' | 'Retard' {
    if (pointage.estEnAttente) return 'Absent';
    if (pointage.estRetard && pointage.estPresent) return 'Retard';
    if (pointage.estPresent) return 'Présent';
    return 'Absent';
  }

  private async loadDerniersPointages(): Promise<void> {
    const response = await this.pointageService.getPointagesJour().toPromise();
    if (response?.status) {
      this.derniersPointages = this.formatDerniersPointages(response.data || []);
    }
  }

  // Modification pour utiliser cardId au lieu de pointageId
  async validerPointage(cardId: string): Promise<void> {
    console.log('Tentative de validation avec cardId:', cardId); // Ajoutez ce log pour debug
    if (!this.isSocketConnected) return;

    try {
      const vigileId = localStorage.getItem('vigile_id');
      if (!vigileId) throw new Error("Session vigile invalide");

      const response = await this.pointageService.validerPointage(cardId, vigileId, 'valider');
      if (response.status) {
        this.nouveauPointage = null;
        await this.loadData();
      }
    } catch (err) {
      console.error('Erreur de validation:', err); // Ajoutez ce log pour debug
      this.error = err instanceof Error ? err.message : "Erreur lors de la validation";
    }
  }

  // Modification pour utiliser cardId au lieu de pointageId
  async refuserPointage(cardId: string): Promise<void> {
    if (!this.isSocketConnected) return;

    try {
      const vigileId = localStorage.getItem('vigile_id');
      if (!vigileId) throw new Error("Session vigile invalide");

      const response = await this.pointageService.validerPointage(cardId, vigileId, 'rejeter');
      if (response.status) {
        this.nouveauPointage = null;
        await this.loadData();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Erreur lors du rejet";
    }
  }




  private formatDerniersPointages(data: any[]): DernierPointage[] {
    return data.map(pointage => ({
      matricule: pointage.utilisateur?.matricule || '',
      cardId: pointage.cardId,
      heure: new Date(pointage.date).toLocaleTimeString(),
      nom: pointage.utilisateur?.nom || '',
      prenom: pointage.utilisateur?.prenom || '',
      status: this.determinerStatus({
        estPresent: pointage.estPresent || false,
        estRetard: pointage.estRetard || false,
        estEnAttente: pointage.estEnAttente || false
      })
    }));
  }

  // Getters pour la pagination et le filtrage
  get filteredUtilisateurs(): UtilisateurPresence[] {
    const searchTerm = this.searchQuery.toLowerCase().trim();
    if (!searchTerm) return this.utilisateurs;

    return this.utilisateurs.filter(user =>
      user.nom.toLowerCase().includes(searchTerm) ||
      user.prenom.toLowerCase().includes(searchTerm) ||
      user.matricule.toLowerCase().includes(searchTerm)

    );
  }

  get paginatedUtilisateurs(): UtilisateurPresence[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUtilisateurs
      .sort((a, b) => {
        // D'abord les présents, puis par heure de pointage
        if ((a.status === 'Présent') !== (b.status === 'Présent')) {
          return a.status === 'Présent' ? -1 : 1;
        }
        const timeA = a.entree !== '-' ? new Date('1970/01/01 ' + a.entree).getTime() : 0;
        const timeB = b.entree !== '-' ? new Date('1970/01/01 ' + b.entree).getTime() : 0;
        return timeB - timeA; // Tri décroissant
      })
      .slice(startIndex, startIndex + this.itemsPerPage);
  }
  get totalPages(): number {
    return Math.ceil(this.filteredUtilisateurs.length / this.itemsPerPage);
  }


  // Ajouter la méthode de contrôle de la porte
  controlDoor(command: 'OPEN' | 'CLOSE'): void {
    if (this.isSocketConnected) {
      this.pointageService.controlDoor(command).subscribe(
        (response: { status: boolean }) => {
          if (response.status) {
            this.doorCommand = command;
          }
        },
        (error) => {
          this.error = "Erreur lors du contrôle de la porte";
          console.error('Erreur contrôle porte:', error);
        }
      );
    } else {
      this.error = "Impossible de contrôler la porte : connexion perdue";
    }
  }

  // Navigation mobile
  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.pc-sidebar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  closeCardError(): void {
    this.cardError = null;
    document.body.style.overflow = 'auto';
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.pointageService.reset();
    document.body.style.overflow = 'auto';
  }

}
