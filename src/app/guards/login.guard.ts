import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService,
    private afAuth: AngularFireAuth,
    private router: Router){}

  canActivate(): Observable<boolean>{
    return this.authService.currentUserObservable.pipe(
      take(1),
      map(user =>{
        return !user
      }),
      tap(loggedIn => {
        if(!loggedIn){
          console.error("Access Denied");
          this.router.navigate(['/'])

        }
      })
    )
  }
}
