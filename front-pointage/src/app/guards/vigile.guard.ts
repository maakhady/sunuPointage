import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService} from '../services/Service1/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VigileGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.isVigile().pipe(
      map(vigileInfo => vigileInfo.isVigile), // Convertir VigileInfo en boolean
      tap(isVigile => {
        if (!isVigile) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
