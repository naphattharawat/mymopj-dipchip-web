import { KioskModule } from './kiosk/kiosk.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, InjectionToken } from '@angular/core';
import { JwtModule } from '@auth0/angular-jwt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { LoginModule } from './login/login.module';
import { SharedModule } from './shared/shared.module';
import { environment } from '../environments/environment';
import { QRCodeModule } from 'angularx-qrcode';
export function tokenGetter() {
  return localStorage.getItem('token');
}

export const whitelistedDomains = [new RegExp('[\s\S]*')] as RegExp[];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule.forRoot(),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: whitelistedDomains,
        blacklistedRoutes: ['/login']
      }
    }),
    SharedModule,
    LoginModule,
    KioskModule,
    QRCodeModule,
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: 'API_URL', useValue: environment.apiUrl },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
