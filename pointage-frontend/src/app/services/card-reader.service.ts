import { Injectable, ApplicationRef } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';  // Ajoute cet import


@Injectable({
  providedIn: 'root',
})
export class CardReaderService {
  private socket: Socket;

  constructor(private appRef: ApplicationRef) {
    this.socket = io('http://localhost:3000', { autoConnect: false });

    // Connecter Socket.IO après la stabilisation d'Angular
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
      this.socket.on('card-scanned', (uid: string) => {
        console.log('Événement reçu depuis le serveur:', uid);
        observer.next(uid);  // Émettre l'UID
      });

      // Gérer la déconnexion du socket
      return () => {
        if (this.socket.connected) {
          this.socket.disconnect();
          console.log('Déconnexion du socket.');
        }
      };
    });
  }

  disconnectSocket() {
    if (this.socket.connected) {
      this.socket.disconnect();
      console.log('Déconnexion du socket.');
    }
  }
}
