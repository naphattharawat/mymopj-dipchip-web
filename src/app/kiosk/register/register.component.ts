import { KioskService } from './../../shared/kiosk.service';
import { AlertService } from 'src/app/shared/alert.service';
import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ActivatedRoute, Router } from '@angular/router';
import * as mqttClient from '../../../vendor/mqtt';
import { MqttClient } from 'mqtt';
import * as Random from 'random-js';
import { CountdownComponent } from 'ngx-countdown';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry } from 'rxjs/operators';
import * as moment from 'moment';
import { NhsoService } from 'src/app/shared/nhso.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  retryConfig: any = {
    delay: 3000,
  };

  myWebSocket: WebSocketSubject<any>;

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

  cardCid: any = '';
  cardFname: any = '';
  cardLname: any = '';
  cardFullName: any = '';
  cardBirthDate: any = '';
  status = 'offline';
  // status = 'online';
  qrdata = '';
  showQR = false;
  sessionId: any;
  sessionId2: any;
  tel: any;
  email: any;
  password: any;
  password2: any;
  
  isSave = false;
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

  async getSession(cid) {
    try {
      const rs: any = await this.kioskService.getSession(cid);
      return rs;
    } catch (error) {
      return { ok: false };
    }
  }

  startSocket() {
    const that = this;
    this.myWebSocket = webSocket(
      'ws://localhost:8443/moph/smartcard'
    );

    this.myWebSocket.subscribe(
      async (msg) => {
        if (msg.status === 'String Retrieved' && msg.data.cid) {
          const sess = await this.getSession(msg.data.cid);
          if (sess.ok) {
            this.sessionId = sess.sessionId;
            this.status = 'online';
            let birth = moment(msg.data.birthdate);
            birth = birth.add(-543, 'year');

            await this.setDataFromCard({
              cid: msg.data.cid,
              fname: msg.data.thai_firstname,
              lname: msg.data.thai_lastname,
              tname: msg.data.thai_title,
              dob: birth.toDate().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            });
          } else {
            this.alertService.serverError();
          }

        }

        if (msg.status === 'Card Exited') {
          this.status = 'offline';
          this.clearDataFromCard();
        }

      },
      (err) => {
        console.log(err);
        setTimeout(function () {
          that.startSocket();
        }, 3000);
      },
      () => {
        console.log('complete');
        setTimeout(function () {
          that.startSocket();
        }, 3000);
      }
    );
  }

  ngOnInit() {
    try {
      this.startSocket();
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
      // this.initialSocket();
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
    // await this.connectWebSocket();
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

  clearDataFromCard() {
    this.cardCid = null;
    this.cardFullName = null;
    this.cardFname = null;
    this.cardLname = null;
    this.cardBirthDate = null;
    this.qrdata = null;
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
      this.cardFname = data.fname;
      this.cardLname = data.lname;
      this.cardFullName = `${data.tname}${data.fname} ${data.lname}`;
      this.cardBirthDate = data.dob;

      const rnd = new Random();
      // const strRnd = rnd.integer(1111111111, 9999999999);
      const sessionId = `${data.cid}-${data.fname}-${data.lname}-${this.sessionId}`;
      this.sessionId2 = sessionId;
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
    this.cardFname = '';
    this.cardLname = '';
    this.cardFullName = '';
    this.cardBirthDate = '';
    this.qrdata = '';
    this.status = 'offline';
    this.email = '';
    this.password = '';
    this.password2 = '';
    this.tel = '';
    this.isSave = false;
  }


  async onClickRegister() {
    this.isSave = true;
    const pwdPolicy = RegExp(/^\w*(?=\w*\d)(?=\w*[a-z])(?=\w*[A-Z])\w*$/);
    if (!pwdPolicy.test(this.password) || this.password.length < 8) {
      this.alertService.error('รหัสผ่านต้องประกอบไปด้วย ตัวใหญ่ ตัวเล็ก ตัวเลข และเกิน 8 ตัวอักษร');
    } else if (this.password !== this.password2) {
      this.alertService.error('รหัสผ่านไม่ตรงกัน');
    } else if (!this.tel) {
      this.alertService.error('กรุณากรอกเบอร์โทรศัพท์');
    } else if (!this.email) {
      this.alertService.error('กรุณากรอกอีเมล');
    } else {
      try {
        const rs: any = await this.kioskService.register(this.cardCid, this.cardFname, this.cardLname, this.email, this.tel, this.password);
        if (rs.ok) {
          const l: any = await this.kioskService.login(this.cardCid, this.password);
          if (l.access_token) {
            const v: any = await this.kioskService.verify(l.access_token, this.sessionId2);
            if (v.ok) {
              this.alertService.success();
              this.clearData();
            } else {
              this.alertService.error(v.error);
              this.isSave = false;
            }
          } else {
            this.alertService.error(l.error);
            this.isSave = false;
          }
          // const v: any = await this.kioskService.verify(this.cardCid, this.cardFname, this.cardLname, this.sessionId);
          this.alertService.success();
          this.clearData();
          this.isSave = false;
        } else {
          this.isSave = false;
          this.alertService.error(rs.error_description);
        }
      } catch (error) {
        this.isSave = false;
        this.alertService.error(error);
      }
    }
  }

}
