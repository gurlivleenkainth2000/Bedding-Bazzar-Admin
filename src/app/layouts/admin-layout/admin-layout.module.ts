import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from 'ngx-clipboard';

import { AdminLayoutRoutes } from './admin-layout.routing';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomersComponent } from '../../pages/customers/customers.component';
import { ServicesComponent } from '../../pages/services/services.component';
import { ImagesComponent } from 'src/app/pages/images/images.component';
import { SliderComponent } from 'src/app/pages/slider/slider.component';
import { VideosComponent } from 'src/app/pages/videos/videos.component';
import { ExtrasComponent } from '../../pages/extras/extras.component';
import { ServiceCategoryComponent } from '../../pages/service-category/service-category.component';
import { OffersComponent } from '../../pages/offers/offers.component';
import { PackagesComponent } from '../../pages/packages/packages.component';
import { QueriesComponent } from '../../pages/queries/queries.component';
import { NotificationsComponent } from '../../pages/notifications/notifications.component';
// import { ToastrModule } from 'ngx-toastr';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    ClipboardModule
  ],
  declarations: [
    DashboardComponent,
    CustomersComponent,
    ServicesComponent,
    ImagesComponent,
    SliderComponent,
    VideosComponent,
    ExtrasComponent,
    ServiceCategoryComponent,
    OffersComponent,
    PackagesComponent,
    QueriesComponent,
    NotificationsComponent
  ]
})

export class AdminLayoutModule {}
