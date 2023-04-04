import { RegisterComponent } from './register/register.component';
import { PrinterComponent } from './printer/printer.component';
import { SettingKioskComponent } from './setting-kiosk/setting-kiosk.component';
import { MainComponent } from './main/main.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  {
    path: 'kiosk',
    // component: LayoutComponent,
    // canActivate: [AuthGuardService],
    children: [
      { path: '', redirectTo: 'main', pathMatch: 'full' },
      { path: 'main', component: MainComponent },
      { path: 'register', component: RegisterComponent },
      {
        path: 'setting', component: LayoutComponent, children: [
          { path: '', component: SettingKioskComponent },
          { path: 'printer', component: PrinterComponent },
        ]
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KioskRoutingModule { }
