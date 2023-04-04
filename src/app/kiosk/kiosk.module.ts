import { PrinterComponent } from './printer/printer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SettingKioskComponent } from './setting-kiosk/setting-kiosk.component';
import { CountdownModule } from 'ngx-countdown';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KioskRoutingModule } from './kiosk-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './main/main.component';
import { LayoutComponent } from './layout/layout.component';
import { QRCodeModule } from 'angularx-qrcode';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [
    MainComponent,
    SettingKioskComponent,
    LayoutComponent,
    PrinterComponent,
    RegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    KioskRoutingModule,
    CountdownModule,
    NgbModule,
    QRCodeModule

  ]
})
export class KioskModule { }
