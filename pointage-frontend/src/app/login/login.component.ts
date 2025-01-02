import { Component, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CardReaderService } from '../services/card-reader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
  cardId: string = '';
  errorMessage: string = '';
  loading: boolean = false;
  private cardScannedSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private cardReader: CardReaderService
  ) {}

  ngOnInit() {
    // Souscrire à l'événement de lecture de la carte
    this.cardScannedSubscription = this.cardReader.onCardScanned().subscribe(
      (uid: string) => {
        console.log('UID reçu dans le composant:', uid);
        this.onCardScanned(uid);
      }
    );
  }

  onCardScanned(uid: string) {
    this.loading = true;
    this.authService.loginWithCard(uid).subscribe({
      next: (response: any) => {
        const fonction = response.user?.fonction;
        this.authService.redirectUser(fonction);
      },
      error: (err) => {
        this.errorMessage =
          'Erreur: ' + (err.error?.error || 'Connexion échouée');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    // Annuler l'abonnement lorsqu'on quitte le composant
    if (this.cardScannedSubscription) {
      this.cardScannedSubscription.unsubscribe();
    }
  }
}
