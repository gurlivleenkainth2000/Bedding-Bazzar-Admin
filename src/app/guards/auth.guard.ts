import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
    private afAuth: AngularFireAuth,
    private router: Router){}



  canActivate(): Observable<boolean>{
    return this.authService.user$.pipe(
      take(1),
      map(user => user && true),
      tap(isAdmin => {
        if(!isAdmin){
          // // console.log('Access denied - Admins only ');
          this.authService.signOut();

        }
      })
    )
  }
  }


