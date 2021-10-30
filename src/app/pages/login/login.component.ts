import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {

  loginInProcess: boolean;
  user: any;

  loader: boolean = false;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null),
    password: new FormControl(null)
  });

  errorMsg: string = "";

  constructor(
    private authService: AuthService,
    private afAuth: AngularFireAuth,
    private router: Router,
    private db: AngularFirestore
  ) {}

  ngOnInit() {
    // this.errorMsg = "";
    this.loginInProcess = false;
  }

  loginFormSubmit(form: FormGroup) {
    let context = this;
    context.loginInProcess = true;
    // this.errorMsg = "";

    const loginPromise = this.authService.login(form.value.email.trim(), form.value.password);
    loginPromise.then(function(suc) {
      context.loginInProcess = false;
    }).catch(function(err) {
      console.log(err);
      context.loginInProcess = false;

      if (err.code === 'auth/user-not-found') {
        context.errorMsg = 'user does not exist, please check email !';
      } else if (err.code === 'auth/user-disabled') {
        context.errorMsg = 'user is disabled, please contact admin !';
      } else if (err.code === 'auth/wrong-password') {
        context.errorMsg = 'Incorrect password !!!';
      } else {
        context.errorMsg = 'Error Occurred, please try again !';
      }


    });
  }

  ngOnDestroy() {}
}
