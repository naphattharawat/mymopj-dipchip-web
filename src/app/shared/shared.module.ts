import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicePointService } from './service-point.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { AuthGuardService } from './auth-guard.service';
import { LoginService } from './login.service';
import { ServiceRoomService } from './service-room.service';
import { PriorityService } from './priority.service';
import { QueueService } from './queue.service';
import { ShortTimePipe } from './short-time.pipe';
import { ThaiDatePipe } from './thai-date.pipe';
import { TokenService } from './token.service';
import { ToggleFullscreenDirective } from './toggle-fullscreen.directive';
import { ModalUserServicePointsComponent } from './modal-user-service-points/modal-user-service-points.component';
import { DepartmentService } from './department.service';
import { ModalSetPrinterComponent } from './modal-set-printer/modal-set-printer.component';
import { AlertWarningPrinterComponent } from './alert-warning-printer/alert-warning-printer.component';
import { ModalSettingSoundComponent } from './modal-setting-sound/modal-setting-sound.component';
import { SoundService } from './sound.service';
import { KioskService } from './kiosk.service';

@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    FormsModule
  ],
  declarations: [
    ShortTimePipe,
    ThaiDatePipe,
    ToggleFullscreenDirective,
    ModalUserServicePointsComponent,
    ModalSetPrinterComponent,
    AlertWarningPrinterComponent,
    ModalSettingSoundComponent
  ],
  exports: [
    ModalUserServicePointsComponent,
    ModalSetPrinterComponent,
    ShortTimePipe,
    ThaiDatePipe,
    ToggleFullscreenDirective,
    AlertWarningPrinterComponent,
    ModalSettingSoundComponent
  ],
  providers: [
    ServicePointService,
    ServiceRoomService,
    PriorityService,
    QueueService,
    AuthGuardService,
    LoginService,
    TokenService,
    DepartmentService,
    SoundService,
    KioskService
  ]
})
export class SharedModule { }
