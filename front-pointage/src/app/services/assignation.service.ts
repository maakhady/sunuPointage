import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

// Interfaces pour une meilleure typage
export interface CardAssignmentResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface CardScanData {
  cardId: string;
  utilisateur?: any;
  pointage?: any;
}

export interface CardError {
  cardId: string;
  message: string;
  code?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssignationService {
  private socket: Socket;
  private cardIdSubject = new BehaviorSubject<string>('');
  public cardId$ = this.cardIdSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🚀 Initialisation du service d\'assignation...');
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    this.initializeSocketListeners();
  }

  private initializeSocketListeners(): void {
    // Log de connexion
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connecté au serveur');
    });

    // Log de déconnexion
    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO déconnecté du serveur');
    });

    // Log des erreurs de connexion
    this.socket.on('connect_error', (error) => {
      console.error('🔴 Erreur de connexion Socket.IO:', error);
    });

    // Écoute des événements de carte scannée
    this.socket.on('card-scanned', (data: CardScanData) => {
      console.log('📡 Carte RFID scannée:', data);
      this.cardIdSubject.next(data.cardId);
    });

    // Écoute des erreurs de carte
    this.socket.on('card-error', (error: CardError) => {
      console.error('❌ Erreur de lecture de carte:', error);
    });

    // Log des événements d'assignation réussie
    this.socket.on('card-assigned', (response: CardAssignmentResponse) => {
      console.log('✅ Carte assignée avec succès:', response);
    });

    // Log des erreurs d'assignation
    this.socket.on('card-assignment-error', (error: any) => {
      console.error('❌ Erreur lors de l\'assignation de la carte:', error);
    });
  }

  // Méthode pour obtenir les scans de carte
  getCardScans(): Observable<CardScanData> {
    return new Observable(observer => {
      const handler = (data: CardScanData) => {
        observer.next(data);
      };

      this.socket.on('card-scanned', handler);

      return () => {
        this.socket.off('card-scanned', handler);
      };
    });
  }

  // Méthode pour obtenir les erreurs de scan
  getCardErrors(): Observable<CardError> {
    return new Observable(observer => {
      const handler = (error: CardError) => {
        observer.next(error);
      };

      this.socket.on('card-error', handler);

      return () => {
        this.socket.off('card-error', handler);
      };
    });
  }

  // Méthode améliorée pour l'assignation de carte
  assignCardSocket(userId: string, cardId: string): Observable<CardAssignmentResponse> {
    console.log('📤 Tentative d\'assignation de carte:', { userId, cardId });
    return new Observable(observer => {
      // Définition des handlers
      const successHandler = (response: CardAssignmentResponse) => {
        console.log('✅ Réponse d\'assignation reçue:', response);
        observer.next(response);
        observer.complete();
        cleanup();
      };

      const errorHandler = (error: any) => {
        console.error('❌ Erreur d\'assignation reçue:', error);
        observer.error(error);
        cleanup();
      };

      // Fonction de nettoyage
      const cleanup = () => {
        this.socket.off('card-assigned', successHandler);
        this.socket.off('card-assignment-error', errorHandler);
      };

      // Mise en place des écouteurs
      this.socket.once('card-assigned', successHandler);
      this.socket.once('card-assignment-error', errorHandler);

      // Émission de l'événement d'assignation
      this.socket.emit('assign-card', { userId, cardId });

      // Retour d'une fonction de cleanup pour l'unsubscribe
      return cleanup;
    });
  }

  // Méthode pour écouter les événements d'assignation réussie
  getCardAssignedEvents(): Observable<CardAssignmentResponse> {
    console.log('👂 Mise en place de l\'écoute des événements d\'assignation réussie');
    return new Observable(observer => {
      const handler = (response: CardAssignmentResponse) => {
        console.log('📥 Événement d\'assignation reçu:', response);
        observer.next(response);
      };

      this.socket.on('card-assigned', handler);

      return () => {
        console.log('🔄 Nettoyage de l\'écoute des événements d\'assignation');
        this.socket.off('card-assigned', handler);
      };
    });
  }

  // Méthode pour écouter les erreurs d'assignation
  getCardAssignmentErrors(): Observable<any> {
    console.log('👂 Mise en place de l\'écoute des erreurs d\'assignation');
    return new Observable(observer => {
      const handler = (error: any) => {
        console.error('📥 Erreur d\'assignation reçue:', error);
        observer.next(error);
      };

      this.socket.on('card-assignment-error', handler);

      return () => {
        console.log('🔄 Nettoyage de l\'écoute des erreurs d\'assignation');
        this.socket.off('card-assignment-error', handler);
      };
    });
  }

  // Méthode pour déclencher manuellement un scan RFID
  triggerRfidScan(cardId: string): void {
    console.log('📤 Émission d\'un événement de scan RFID:', cardId);
    this.socket.emit('rfid-scan', cardId);
  }

  // Méthode pour vérifier l'état de la connexion
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Méthode pour reconnecter manuellement
  reconnect(): void {
    if (!this.isConnected()) {
      console.log('🔄 Tentative de reconnexion...');
      this.socket.connect();
    }
  }

  // Méthode de nettoyage pour la déconnexion propre
  disconnect() {
    console.log('👋 Déconnexion du service d\'assignation');
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Méthode pour obtenir le dernier cardId
  getLastCardId(): string {
    return this.cardIdSubject.getValue();
  }

  startAssignmentMode(userId: string) {
    console.log('Démarrage mode assignation pour userId:', userId);
    this.socket.emit('start-assignment-mode', userId);
  }

  endAssignmentMode() {
    console.log('Fin mode assignation');
    this.socket.emit('end-assignment-mode');
  }
}
