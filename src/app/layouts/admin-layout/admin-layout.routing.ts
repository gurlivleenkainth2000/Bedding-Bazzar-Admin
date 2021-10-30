import { Routes } from "@angular/router";
import { CustomersComponent } from "src/app/pages/customers/customers.component";
import { ImagesComponent } from "src/app/pages/images/images.component";
import { OffersComponent } from "src/app/pages/offers/offers.component";
import { ServiceCategoryComponent } from "src/app/pages/service-category/service-category.component";
import { PackagesComponent } from "src/app/pages/packages/packages.component";
import { ServicesComponent } from "src/app/pages/services/services.component";
import { SliderComponent } from "src/app/pages/slider/slider.component";
import { VideosComponent } from "src/app/pages/videos/videos.component";
import { DashboardComponent } from "../../pages/dashboard/dashboard.component";
import { QueriesComponent } from "src/app/pages/queries/queries.component";
import { NotificationsComponent } from "src/app/pages/notifications/notifications.component";

export const AdminLayoutRoutes: Routes = [
  // { path: "dashboard", component: DashboardComponent },
  { path: "customers", component: CustomersComponent },
  { path: "product-categories", component: ServiceCategoryComponent },
  { path: "products", component: ServicesComponent },
  // { path: "packages", component: PackagesComponent },
  { path: "images", component: ImagesComponent },
  { path: "slider-images", component: SliderComponent },
  { path: "videos", component: VideosComponent },
  { path: "offers", component: OffersComponent },
  { path: "queries", component: QueriesComponent },
  { path: "notifications", component: NotificationsComponent },
];
