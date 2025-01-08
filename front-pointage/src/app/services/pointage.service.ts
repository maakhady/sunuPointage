// src/app/services/pointage.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of ,forkJoin } from 'rxjs';
import { map, catchError,  tap,  } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import {
  Pointage,
  Utilisateur,
  PointageResponse,
  ApiResponse
} from '../demo/pointage/pointage.interface';

@Injectable({
  providedIn: 'root'
})
export class PointageService implements OnDestroy {
  private socket: Socket;
  private apiUrl = 'http://localhost:8000/api';
  private nodeServerUrl = 'http://localhost:3000';
  private currentPointage = new BehaviorSubject<Pointage | null>(null);
  private pointagesEnAttente = new BehaviorSubject<Pointage[]>([]);
  private errorSubject = new Subject<{ message: string; cardId?: string }>();
  private currentPointagesList = new BehaviorSubject<any[]>([]);
  private doorStatus = new BehaviorSubject<'open' | 'closed'>('closed');
  private socketConnected = new BehaviorSubject<boolean>(false);
  private cardErrorSubject = new Subject<{cardId: string, message: string, code: number} | null>();
  cardError$ = this.cardErrorSubject.asObservable();



  constructor(private http: HttpClient) {
    this.socket = io(this.nodeServerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.initializeSocketListeners();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  handleCardError(error: any) {
    if (error) {
      this.cardErrorSubject.next({
        cardId: error.cardId,
        message: error.message,
        code: error.code
      });
    }
  }

  getSocketConnectionStatus(): Observable<boolean> {
    return this.socketConnected.asObservable();
  }

  private handleError(operation = 'opération') {
    return (error: HttpErrorResponse): Observable<any> => {
      console.error(`Erreur pendant ${operation}:`, error);

      if (error.error instanceof ErrorEvent) {
        console.error('Erreur client:', error.error.message);
      } else {
        console.error(
          `Erreur backend (code ${error.status}):`,
          error.error?.message || error.statusText
        );
      }

      return of({
        status: false,
        message: `Erreur lors de la ${operation}`,
        data: null,
        error: error.error?.message || error.statusText
      });
    };
  }

  private initializeSocketListeners(): void {
    // Gestion des connexions
    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
      this.socketConnected.next(true);
      this.refreshAllData(); // Rafraîchir les données à la connexion
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
      this.socketConnected.next(false);
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('Tentative de reconnexion...');
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnecté après ${attemptNumber} tentatives`);
      this.refreshAllData(); // Rafraîchir les données après reconnexion
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      this.errorSubject.next({ message: 'Erreur de connexion au serveur' });
      this.socketConnected.next(false);
    });

    // Gestion des pointages
    this.socket.on('card-scanned', (data: {
      cardId: string;
      utilisateur: Utilisateur;
      pointage: Pointage;
    }) => {
      console.log('Carte scannée:', data);
      if (data.pointage) {
        const pointageComplet = {
          ...data.pointage,
          cardId: data.cardId,
          utilisateur: data.utilisateur
        };
        this.currentPointage.next(pointageComplet);
        this.refreshAllData(); // Rafraîchir après scan
      }
    });

    this.socket.on('door-status', (status: 'open' | 'closed') => {
      this.doorStatus.next(status);
    });

    this.socket.on('card-error', (data: { cardId: string; message: string; code?: number }) => {
      console.error('Erreur de carte:', data);
      this.errorSubject.next(data);
    });

    this.socket.on('pointage-en-attente', (data: {
      cardId: string;
      pointage: Pointage;
    }) => {
      console.log('Pointage en attente reçu:', data);
      const currentPointages = this.pointagesEnAttente.value;
      if (!currentPointages.find(p => p.cardId === data.cardId)) {
        const pointageAvecCard = {
          ...data.pointage,
          cardId: data.cardId
        };
        this.pointagesEnAttente.next([...currentPointages, pointageAvecCard]);
        this.refreshAllData(); // Rafraîchir après pointage en attente
      }
    });

    this.socket.on('pointage-validated', (response: PointageResponse) => {
      console.log('Pointage validé:', response);
      if (response.status && response.data?.pointage) {
        const pointageValidated = response.data.pointage;
        if (this.currentPointage.value?.cardId === pointageValidated.cardId) {
          this.currentPointage.next(pointageValidated);
        }

        const currentPointages = this.pointagesEnAttente.value;
        const updatedPointages = currentPointages.filter(
          p => p.cardId !== pointageValidated.cardId
        );
        this.pointagesEnAttente.next(updatedPointages);

        this.refreshAllData(); // Rafraîchir après validation
      }
    });

    // Modifier cette partie pour utiliser handleCardError
  this.socket.on('card-error', (data: { cardId: string; message: string; code: number }) => {
    console.log('Erreur de carte reçue:', data);
    this.handleCardError(data);  // Utilisez handleCardError au lieu de errorSubject
  });
 }
// Ajouter cette méthode pour centraliser le rafraîchissement
private refreshAllData() {
  console.log('Rafraîchissement de toutes les données');
  this.getPointagesJour().subscribe(response => {
    if (response.status) {
      console.log('Pointages jour mis à jour:', response.data);
      this.currentPointagesList.next(response.data);
    }
  });

  this.getAllUtilisateursActifs().subscribe(response => {
    if (response.status) {
      console.log('Liste des utilisateurs mise à jour:', response.data);
    }
  });
}



  getAllUtilisateursActifs(): Observable<ApiResponse<any[]>> {
    return forkJoin({
      utilisateurs: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/utilisateurs`),
      pointages: this.getPointagesJour()
    }).pipe(
      map(({ utilisateurs, pointages }) => {
        console.log('Données brutes utilisateurs:', utilisateurs.data[0]); // Pour voir la structure exacte

        if (utilisateurs.status && pointages.status) {
          const pointagesMap = new Map(
            pointages.data.map(p => [p.user_id, p])
          );

          utilisateurs.data = utilisateurs.data
            .filter(user => user.statut === 'actif')
            .map(user => {
              // Utilisons id au lieu de _id
              const userId = user.id || user._id || user.user_id;
              const pointage = pointagesMap.get(userId);

              console.log(`Mapping pour ${user.nom}:`, {
                user,
                userId,
                pointage
              });

              return {
                ...user,
                pointage,
                estPresent: pointage?.estPresent ?? false,
                estRetard: pointage?.estRetard_temp ?? false,
                estEnAttente: pointage?.estEnAttente ?? false,
                premierPointage: pointage?.premierPointage_temp,
                dernierPointage: pointage?.dernierPointage
              };
            });
        }
        return utilisateurs;
      }),
      tap(response => {
        console.log('Réponse finale:', response);
      }),
      catchError(this.handleError('récupération des utilisateurs'))
    );
  }

  getPointagesJour(): Observable<ApiResponse<any[]>> {
    console.log('Appel de getPointagesJour');
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/pointages/jour`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Réponse brute de getPointagesJour:', response);
        if (response.status) {
          this.currentPointagesList.next(response.data);
          console.log('Liste des pointages mise à jour:', response.data);
        }
      }),
      catchError(error => {
        console.error('Erreur dans getPointagesJour:', error);
        return this.handleError('récupération des pointages du jour')(error);
      })
    );
  }

  // Contrôle de la porte
  controlDoor(command: 'OPEN' | 'CLOSE'): Observable<any> {
    return new Observable(observer => {
      this.socket.emit('door-control', command);
      observer.next({ status: true });
      observer.complete();
    });
  }

  // Écoute du statut de la porte
  getDoorStatus(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('door-status', (response: any) => {
        observer.next(response);
      });
    });
  }

  validerPointage(cardId: string, vigileId: string, action: 'valider' | 'rejeter'): Promise<PointageResponse> {
    return this.http.post<PointageResponse>(
      `${this.apiUrl}/pointages/cartes/${cardId}/valider`,
      {
        vigile_id: vigileId,
        action: action
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('Réponse validation:', response)),
      catchError(error => {
        console.error('Erreur validation:', error);
        throw error;
      })
    ).toPromise();
}

  // isVigile(): Observable<VigileInfo> {
  //   return this.http.get<ApiResponse<any>>(`${this.apiUrl}/utilisateurs/me`, {
  //     headers: this.getAuthHeaders()
  //   }).pipe(
  //     map(response => {
  //       console.log('Réponse de l\'API pour la vérification de la fonction:', response);
  //       if (response.status && response.data) {
  //         const vigileInfo = {
  //           isVigile: response.data.fonction === 'Vigile',
  //           vigileId: response.data.id
  //         };

  //         if (vigileInfo.isVigile && vigileInfo.vigileId) {
  //           localStorage.setItem('vigile_id', vigileInfo.vigileId);
  //         }

  //         return vigileInfo;
  //       }
  //       return { isVigile: false };
  //     }),
  //     catchError((error) => {
  //       console.error('Erreur lors de la vérification de la fonction:', error);
  //       return of({ isVigile: false });
  //     })
  //   );
  // }

  getCurrentPointage(): Observable<Pointage | null> {
    return this.currentPointage.asObservable();
  }

  getPointagesEnAttente(): Observable<Pointage[]> {
    return this.pointagesEnAttente.asObservable();
  }

  getErrors(): Observable<{ message: string; cardId?: string; code?: number }> {
    return this.errorSubject.asObservable();
  }



  getCurrentPointagesList(): Observable<any[]> {
    return this.currentPointagesList.asObservable();
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  refreshPointages() {
    this.getPointagesJour().subscribe();
  }

  removePointageEnAttente(cardId: string) {
    const currentPointages = this.pointagesEnAttente.value;
    const updatedPointages = currentPointages.filter(p => p.cardId !== cardId);
    this.pointagesEnAttente.next(updatedPointages);
  }

  reset() {
    this.currentPointage.next(null);
    this.pointagesEnAttente.next([]);
    this.currentPointagesList.next([]);
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
