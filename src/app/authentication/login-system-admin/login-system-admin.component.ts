import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../_services/authentication.service';
import { CommonService } from '../../_services/common.service';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuItems } from './../../shared/menu-items/menu-items';

@Component({
  selector: 'app-login-system-admin',
  templateUrl: './login-system-admin.component.html'
})
export class LoginSystemAdminComponent implements OnInit {
  LoginForm: FormGroup;
  submitted = false;
  returnUrl: string;
  @BlockUI() blockUI: NgBlockUI;
  constructor(
    public formBuilder: FormBuilder,
    private authService: AuthenticationService,
    private toastr: ToastrService,
    private router: Router,
    private menuItems: MenuItems,
    private route: ActivatedRoute
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
  }

  ngOnInit() {
    this.LoginForm = this.formBuilder.group({
      Email: [null, [Validators.required, Validators.email]],
      Password: [null, [Validators.required]],
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  get f() {
    return this.LoginForm.controls;
  }

  onLoginSubmit() {
    this.submitted = true;
    if (this.LoginForm.invalid) {
      return;
    }
    this.blockUI.start('Login..');
    // let url;
    // switch (this.LoginForm.value.user_type) {
    //   case "Admin":
    //     url = 'admins/login';
    //     break;
    //   case "Speaker":
    //     url = 'speakers/login';
    //     break;
    //   case "Participant":
    //     url = 'bp-users/login';
    //     break;

    // }

    this.authService.login({ UserName: this.LoginForm.value.Email, Password: this.LoginForm.value.Password}).subscribe(
      data => {

        if(!data){
          this.blockUI.stop();
          return;
        }
        if (data.detsil) {
          this.toastr.error(data.detsil, 'Error!', { timeOut: 3000 });
          this.blockUI.stop();
        }else{

          if (data.access) {

            this.authService.verifyToken(data.access).subscribe(
              data2 => {
                this.blockUI.stop();
                if (data2) {

                  this.toastr.success('Logged in successfully', 'Success!', { timeOut: 2000 });
                  this.router.navigate([this.returnUrl]);
                  this.menuItems.refreshMenu();
                }else{
                  this.toastr.error(data2.Message, 'Error!', { timeOut: 3000 });
                }
              },
              error => {
                this.blockUI.stop();
                if (error.status === 400) {
                  this.toastr.error('Unauthorized request found', 'Error!', { timeOut: 3000 });
                } else if (error.status === 401) {
                  this.toastr.error('Invalid Email Or Password', 'Error!', { timeOut: 3000 });
                }
              }
            );
            // this.toastr.success('Logged in successfully', 'Success!', { timeOut: 2000 });
            // this.router.navigate([this.returnUrl]);
            // this.menuItems.refreshMenu();
          }else{
            this.toastr.error(data.Msg, 'Error!', { timeOut: 3000 });
            this.blockUI.stop();
          }

        }




      },
      error => {
        this.blockUI.stop();
        if (error.status === 400) {
          this.toastr.error('Unauthorized request found', 'Error!', { timeOut: 3000 });
        } else if (error.status === 401) {
          this.toastr.error('Invalid Email Or Password', 'Error!', { timeOut: 3000 });
        }
      }
    );

  }




}
