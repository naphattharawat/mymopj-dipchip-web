import { KioskService } from './../../shared/kiosk.service';
import { AlertService } from 'src/app/shared/alert.service';
import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ActivatedRoute, Router } from '@angular/router';
import * as mqttClient from '../../../vendor/mqtt';
import { MqttClient } from 'mqtt';
import * as Random from 'random-js';
import { CountdownComponent } from 'ngx-countdown';
import * as moment from 'moment';
import { NhsoService } from 'src/app/shared/nhso.service';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  id: any;
  jwtHelper = new JwtHelperService();
  hn: any;
  tabServicePoint = false;
  btnSelectServicePoint = false;
  tabPrioritie = false;
  priorityId: any;
  // tabPrioritie = true;
  tabProfile = true;
  servicePointList = [];
  token: any;
  hospname: any;
  isOffline = false;
  client: MqttClient;
  notifyUser = null;
  notifyPassword = null;
  notifyUrl: string;
  kioskId: any;
  isPrinting = false;

  cardCid: any = "";
  cardFullName: any = "";
  cardBirthDate: any = "";
  status = 'offline';
  // status = 'online';
  qrdata = '';
  showQR = false;
  @ViewChild(CountdownComponent) counter: CountdownComponent;

  constructor(
    private route: ActivatedRoute,
    private alertService: AlertService,
    private kioskService: KioskService,
    private zone: NgZone,
    private router: Router,
    private nhsoService: NhsoService) {
    this.route.queryParams
      .subscribe(params => {
        this.token = params.token || null;
      });
  }

  ngOnInit() {
    try {
      // this.token = this.token || localStorage.getItem('token');
      // if (this.token) {
      //   const decodedToken = this.jwtHelper.decodeToken(this.token);
      //   this.notifyUrl = `ws://${decodedToken.NOTIFY_SERVER}:${+decodedToken.NOTIFY_PORT}`;
      //   this.notifyUser = decodedToken.NOTIFY_USER;
      //   this.notifyPassword = decodedToken.NOTIFY_PASSWORD;
      //   this.kioskId = localStorage.getItem('kioskId') || '1';
      //   this.urlSendAPIGET = localStorage.getItem('urlSendVisitGet') ? localStorage.getItem('urlSendVisitGet') : null;
      //   this.urlSendAPIPOST = localStorage.getItem('urlSendVisitPost') ? localStorage.getItem('urlSendVisitPost') : null;
      //   this.isSendAPIGET = localStorage.getItem('isSendAPIGET') === 'Y' ? true : false;
      //   this.isSendAPIPOST = localStorage.getItem('isSendAPIPOST') === 'Y' ? true : false;
      this.initialSocket();
      // } else {
      //   this.alertService.error('ไม่พบ TOKEN');
      // }

    } catch (error) {
      console.log(error);
      this.alertService.serverError();
    }
  }
  async initialSocket() {
    // await this.getInfoHospital();
    // await this.getServicePoint();
    // await this.getTokenNHSO();
    // await this.setInterval();
    await this.connectWebSocket();
  }


  connectWebSocket() {
    const rnd = new Random();
    const username = sessionStorage.getItem('username');
    const strRnd = rnd.integer(1111111111, 9999999999);
    const clientId = `${username}-${strRnd}`;

    try {
      this.client = mqttClient.connect('ws://localhost:8888', {
        clientId: clientId,
        username: 'mymoph',
        password: 'mymoph'
      });
    } catch (error) {
      console.log(error);
    }

    const topic = `SMARTCARD/#`;

    const that = this;

    this.client.on('message', async (_topic, payload) => {
      try {
        console.log(_topic);
        const _payload = JSON.parse(payload.toString());
        if (_payload) {
          if (_topic === 'SMARTCARD/CARD-INSERT') {
            this.status = 'online';
            await this.setDataFromCard(_payload);
          } else {
            if (_topic === 'SMARTCARD/CARD-REMOVE') {
              this.status = 'offline';

            }
          }
        } else {
          this.status = 'offline';
          // this.clearData();
        }
      } catch (error) {
        console.log(error);
      }

    });

    this.client.on('connect', () => {
      console.log(`Connected!`);
      that.zone.run(() => {
        that.isOffline = false;
      });

      that.client.subscribe(topic, { qos: 0 }, (error) => {
        if (error) {
          that.zone.run(() => {
            that.isOffline = true;
            try {
              that.counter.restart();
            } catch (error) {
              console.log(error);
            }
          });
        } else {
          console.log(`subscribe ${topic}`);
        }
      });
    });

    this.client.on('close', () => {
      console.log('MQTT Conection Close');
    });

    this.client.on('error', (error) => {
      console.log('MQTT Error');
      that.zone.run(() => {
        that.isOffline = true;
        that.counter.restart();
      });
    });

    this.client.on('offline', () => {
      console.log('MQTT Offline');
      that.zone.run(() => {
        that.isOffline = true;
        try {
          that.counter.restart();
        } catch (error) {
          console.log(error);
        }
      });
    });
  }


  home() {
    this.router.navigate(['/kiosk/setting']);
  }

  async setDataFromCard(data) {
    try {

      console.log(data);
      if (data.cid.length === 13) {
        this.showQR = true;
      } else {
        this.showQR = false;

      }
      this.cardCid = data.cid;
      this.cardFullName = `${data.tname}${data.fname} ${data.lname}`;
      this.cardBirthDate = data.dob;

      const rnd = new Random();
      const strRnd = rnd.integer(1111111111, 9999999999);
      const sessionId = `${data.cid}-${data.fname}-${data.lname}-${strRnd}`;
      this.qrdata = `mymoph://qr?clientId=rLiNPkqoljnPWlQtjoVc&sessionId=${sessionId}`;
      // if (this.cardCid) {

      //   // await this.getPatient('CID');
      //   // await this.getRemed();
      //   // await this.getNhso(this.cardCid);
      // } else {
      //   this.alertService.error('บัตรมีปัญหา กรุณาเสียบใหม่อีกครั้ง', null, 1000);
      // }
    } catch (error) {
      console.log(error);

    }

  }

  clearData() {
    this.cardCid = '';
    this.cardFullName = '';
    this.cardBirthDate = '';
    this.qrdata = '';
    this.status = 'offline';
  }


}
