import { Injectable } from "@angular/core";
// import { AuthInfo } from "./auth-info";

import { BehaviorSubject, Observable, Subject } from "rxjs";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { switchMap, take, map, tap } from "rxjs/operators";
import { AngularFirestore } from "@angular/fire/firestore";
import { of } from "rxjs";
import * as util from "util";

@Injectable({
  providedIn: "root",
})
export class AuthService {

  static context: any;
  user$: Observable<any>;
  username: string;

  adminModel: any;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private db: AngularFirestore
  ) {
    AuthService.context = this;
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          // console.log(user.uid);
          // this.getUserFromDB(user.uid);
          return this.afAuth.idTokenResult;
        } else {
          return of(null);
        }
      })
    );
  }

  get currentUserObservable(): any {
    return this.afAuth.authState;
  }

  login(email, pass) {
    return new Promise<any>((resolve, reject) => {
      this.afAuth.signInWithEmailAndPassword(email, pass).then(
        (res) => {
          this.getUserFromDB(res.user.uid);
          this.user$ = this.afAuth.idTokenResult;
          this.router.navigate(["/"]);
          resolve(res);
        },
        (err) => reject(err)
      );
    });
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      AuthService.context.router.navigate(["/login"]);
    });
  }

  getUserFromDB(uid) {
    this.db
      .collection('admin')
      .doc(uid)
      .valueChanges()
      .subscribe((adminModel: any) => {
        this.adminModel = adminModel;
      });
  }
}
