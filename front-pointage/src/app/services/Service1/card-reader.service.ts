import { Injectable, ApplicationRef } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject  } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CardReaderService {
  private socket: Socket;
  private errorSubject = new Subject<string>();
  errorMessage$ = this.errorSubject.asObservable();

  

  constructor(private appRef: ApplicationRef) {
    this.socket = io('http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000
    });


    this.appRef.isStable
      .pipe(first((isStable) => isStable))
      .subscribe(() => {
        console.log('Angular est stable, connexion au serveur Socket.IO.');
        this.socket.connect();
      });
  }




  // Retourner un Observable à partir de l'événement 'card-scanned'
  onCardScanned(): Observable<string> {
    return new Observable((observer) => {
      const cardScannedHandler = (uid: string) => {
        console.log('Événement reçu depuis le serveur:', uid);
        observer.next(uid);
      };

      const cardErrorHandler = (data: { uid: string, message: string }) => {
        console.log('Erreur reçue depuis le serveur:', data.message);
        observer.error(new Error(data.message));
      };

      this.socket.on('card-scanned', cardScannedHandler);
      this.socket.on('card-error', cardErrorHandler);

      // Ne déconnecte plus le socket, retire seulement les listeners
      return () => {
        this.socket.off('card-scanned', cardScannedHandler);
        this.socket.off('card-error', cardErrorHandler);
      };
    });
  }

  // Observable séparé pour les erreurs si vous préférez
  onCardError(): Observable<string> {
    return new Observable((observer) => {
      const errorHandler = (data: { uid: string, message: string }) => {
        console.log('Erreur reçue depuis le serveur:', data.message);
        observer.next(data.message);
      };

      this.socket.on('card-error', errorHandler);

      // Ne déconnecte plus le socket, retire seulement le listener
      return () => {
        this.socket.off('card-error', errorHandler);
      };
    });
  }


 // Méthode de déconnexion explicite à appeler lors de la déconnexion de l'utilisateur
 disconnectSocket() {
  if (this.socket.connected) {
    this.socket.disconnect();
    console.log('Déconnexion du socket.');
  }
}
}
