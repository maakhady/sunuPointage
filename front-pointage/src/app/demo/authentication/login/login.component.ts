import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/Service1/auth.service';
import { CardReaderService } from '../../../services/Service1/card-reader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy, OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  showPassword = false;
  private cardScannedSubscription: Subscription | undefined;
  private cardErrorSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cardReader: CardReaderService,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    this.cardScannedSubscription = this.cardReader.onCardScanned().subscribe({
      next: (uid: string) => {
        console.log('UID reçu dans le composant:', uid);
        this.onCardScanned(uid);
      },
      error: (error) => {
        console.error('Erreur de lecture de carte:', error);
        this.errorMessage = error.message;
        this.loading = false;
      }
    });

    this.cardErrorSubscription = this.cardReader.onCardError().subscribe(
      (errorMessage: string) => {
        this.errorMessage = errorMessage;
        this.loading = false;
      }
    );
  }

  onCardScanned(uid: string) {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithCard(uid).subscribe({
      next: (response) => {
        if (response.status) {
          this.authService.handleLoginResponse(response);
        } else {
          this.errorMessage = response.message || 'Erreur de connexion';
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.errorMessage = error.error?.message || 'Carte non autorisée';
        } else {
          this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la connexion';
        }
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.errorMessage = '';
      this.loading = true;

      this.http.post<any>('http://localhost:8000/api/utilisateurs/login', { email, password })
        .subscribe({
          next: (response) => {
            if (response.status) {
              this.authService.handleLoginResponse(response);
            } else {
              this.errorMessage = response.message || 'Erreur de connexion';
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur de connexion:', error);
            this.errorMessage = error.error?.message || 'Email ou mot de passe incorrect';
            this.loading = false;
          }
        });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forget-password']);
  }

  ngOnDestroy() {
    if (this.cardScannedSubscription) {
      this.cardScannedSubscription.unsubscribe();
    }
    if (this.cardErrorSubscription) {
      this.cardErrorSubscription.unsubscribe();
    }
  }
}
