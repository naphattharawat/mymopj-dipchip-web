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

  cardCid: any;
  cardFullName: any;
  cardBirthDate: any;
  his: any;
  hisHn: any;
  hisFullName: any;
  hisBirthDate: any;

  rightName: any;
  rightStartDate: any;
  rightHospital: any;
  isSendAPIGET: any;
  isSendAPIPOST: any;
  urlSendAPIGET: any;
  urlSendAPIPOST: any;
  status = 'offline';
  isManual = false;
  isClick = false;
  // status = 'online';
  queueNumber: any;
  roomName: any;
  nhsoToken: any;
  nhsoCid: any;
  cid = '';
  remed: any = false;
  btnGetCard = false;
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
      this.token = this.token || localStorage.getItem('token');
      if (this.token) {
        const decodedToken = this.jwtHelper.decodeToken(this.token);
        this.notifyUrl = `ws://${decodedToken.NOTIFY_SERVER}:${+decodedToken.NOTIFY_PORT}`;
        this.notifyUser = decodedToken.NOTIFY_USER;
        this.notifyPassword = decodedToken.NOTIFY_PASSWORD;
        this.kioskId = localStorage.getItem('kioskId') || '1';
        this.urlSendAPIGET = localStorage.getItem('urlSendVisitGet') ? localStorage.getItem('urlSendVisitGet') : null;
        this.urlSendAPIPOST = localStorage.getItem('urlSendVisitPost') ? localStorage.getItem('urlSendVisitPost') : null;
        this.isSendAPIGET = localStorage.getItem('isSendAPIGET') === 'Y' ? true : false;
        this.isSendAPIPOST = localStorage.getItem('isSendAPIPOST') === 'Y' ? true : false;
        this.initialSocket();
      } else {
        this.alertService.error('ไม่พบ TOKEN');
      }

    } catch (error) {
      console.log(error);
      this.alertService.serverError();
    }
  }
  async initialSocket() {
    // connect mqtt
    // await this.connectWebSocket();
    await this.getInfoHospital();
    await this.getServicePoint();
    await this.getTokenNHSO();
    await this.setInterval();
  }

  async getTokenNHSO() {
    try {
      const rs: any = await this.kioskService.getTokenNHSO(this.token);
      if (rs.statusCode === 200) {
        this.nhsoToken = rs.rows.token;
        this.nhsoCid = rs.rows.cid;
      }
    } catch (error) {
      console.log(error);

    }
  }

  connectWebSocket() {
    const rnd = new Random();
    const username = sessionStorage.getItem('username');
    const strRnd = rnd.integer(1111111111, 9999999999);
    const clientId = `${username}-${strRnd}`;

    try {
      this.client = mqttClient.connect(this.notifyUrl, {
        clientId: clientId,
        username: this.notifyUser,
        password: this.notifyPassword
      });
    } catch (error) {
      console.log(error);
    }

    const topic = `kiosk/${this.kioskId}`;

    const that = this;

    this.client.on('message', async (topic, payload) => {
      try {
        const _payload = JSON.parse(payload.toString());
        if (_payload.ok) {
          this.status = 'online';
          await this.setDataFromCard(_payload.results);
        } else {
          this.status = 'offline';
          this.clearData();
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

  async getInfoHospital() {
    try {
      const rs: any = await this.kioskService.getInfo(this.token);
      this.hospname = rs.info.hosname;
    } catch (error) {
      console.log(error);
      this.alertService.serverError();
    }
  }

  async getServicePoint() {
    try {
      const rs: any = await this.kioskService.getServicePoint(this.token);
      if (rs.statusCode === 200) {
        this.servicePointList = rs.results;
      }
    } catch (error) {
      console.log(error);
      this.alertService.serverError();
    }
  }

  async getPatient(type) {
    try {
      let rs: any;
      if (type === 'CID') {
        rs = await this.kioskService.getPatient(this.token, { 'cid': this.cardCid });
      } else {
        rs = await this.kioskService.getPatient(this.token, { 'hn': this.cardCid });
      }
      if (rs.statusCode === 200) {
        this.status = 'online';
        this.setDataFromHIS(type, rs.results);
      } else {
        this.alertService.error('ไม่พบข้อมูล HN กรุณาติดต่อห้องบัตร');
      }
    } catch (error) {
      console.log(error);
      this.alertService.serverError();
    }
  }

  async getRemed() {
    try {
      if (this.hisHn) {
        // const rs: any = await this.kioskService.getRemed(this.token, this.hisHn);
        // if (rs.statusCode === 200) {
        //   this.remed = true;
        // } else {
        //   this.remed = false;
        // }
        this.remed = false;
      }
    } catch (error) {
      this.remed = false;
      console.log(error);
      // this.alertService.serverError();
    }
  }


  onSelectServicePointList() {
    this.tabServicePoint = true;
    this.tabProfile = false;
  }

  cancel() {
    this.btnSelectServicePoint = true;
    this.tabServicePoint = false;
    this.tabProfile = true;
  }

  onSearch() {
    if (this.cid.length === 13) {
      this.onSearchCid();
    } else {
      this.onSearchHN();
    }
  }

  async onSearchHN() {
    // this.status = 'online';
    this.cardCid = this.cid;
    this.hn = this.cid;
    this.cid = '';

    await this.getPatient('HN');
    await this.getRemed();
    await this.getNhso(this.cardCid);
  }

  async onSearchCid() {
    // this.status = 'online';
    this.cardCid = this.cid;
    await this.getPatient('CID');
    await this.getRemed();
    await this.getNhso(this.cardCid);
  }

  async setDataFromCard(data) {
    try {

      this.cardCid = data.cid;
      this.cardFullName = data.fullname;
      this.cardBirthDate = data.birthDate;
      if (this.cardCid) {
        await this.getPatient('CID');
        await this.getRemed();
        await this.getNhso(this.cardCid);
      } else {
        this.alertService.error('บัตรมีปัญหา กรุณาเสียบใหม่อีกครั้ง', null, 1000);
      }
    } catch (error) {
      console.log(error);

    }

  }

  async setDataFromHIS(type, data) {
    if (data.hn) {
      this.his = data;
      this.hisHn = data.hn;
      this.hisFullName = `${data.title}${data.firstName} ${data.lastName}`;
      this.hisBirthDate = data.birthDate;
      this.remed = data.remed || false;
      if (this.his) {
        await this.setTab();
      }
    } else {
      this.alertService.error('ไม่พบ HN');
    }
  }

  setTab() {
    if (+this.servicePointList.length <= 6) {
      this.tabPrioritie = true;
      // this.tabServicePoint = true;
      this.btnSelectServicePoint = false;
    } else {
      this.btnSelectServicePoint = true;
    }
  }

  clickPrioritie(id) {
    this.tabPrioritie = false;
    this.priorityId = id;
    this.tabServicePoint = true;
  }

  clearData() {
    this.cardCid = '';
    this.cardFullName = '';
    this.cardBirthDate = '';

    this.hisBirthDate = '';
    this.hisFullName = '';
    this.hisHn = '';

    this.rightName = '';
    this.rightStartDate = '';
    this.rightHospital = '';


    this.remed = null;

    this.tabProfile = true;
    this.btnSelectServicePoint = false;
    this.tabServicePoint = false;
    this.status = 'offline';
    this.isManual = false;
  }

  async print(queueId) {
    const printerId = localStorage.getItem('clientPrinterId');
    const printSmallQueue = localStorage.getItem('printSmallQueue') || 'N';
    const topicPrint = '/printer/' + printerId;

    const data = {
      queueId: queueId,
      topic: topicPrint,
      printSmallQueue: printSmallQueue
    };
    try {
      const rs: any = await this.kioskService.print(this.token, data);
      if (rs.statusCode === 200) {
        // this.clearData();
      }
      this.isPrinting = false;
    } catch (error) {
      console.log(error);
      this.isPrinting = false;
      alert('ไม่สามารถพิมพ์บัตรคิวได้');
    }
  }

  async printIdCard() {
    const printerId = localStorage.getItem('clientPrinterId');
    const topicPrint = '/printer/' + printerId;

    const data = {
      topic: topicPrint,
      printIdCard: true
    };
    try {
      const rs: any = await this.kioskService.printIdCard(this.token, data);
      this.isPrinting = false;
    } catch (error) {
      console.log(error);
      this.isPrinting = false;
      alert('ไม่สามารถพิมพ์บัตรคิวได้');
    }
  }

  async register(servicePoint) {
    this.isPrinting = true;
    this.isClick = true;
    const priorityId = this.priorityId || '1';
    const data = {
      hn: this.his.hn,
      vn: 'K' + moment().format('x'),
      clinicCode: servicePoint.local_code,
      priorityId: priorityId,
      dateServ: moment().format('YYYY-MM-DD'),
      timeServ: moment().format('HHmm'),
      hisQueue: '',
      firstName: this.his.firstName,
      lastName: this.his.lastName,
      title: this.his.title,
      birthDate: this.his.engBirthDate,
      sex: this.his.sex,
    };
    try {
      const rs: any = await this.kioskService.register(this.token, data);
      if (rs.statusCode === 200) {
        if (rs.queueId) {
          await this.print(rs.queueId);
          this.btnSelectServicePoint = false;
          this.tabServicePoint = false;
          this.tabPrioritie = false;
          this.priorityId = null;
          if (this.isSendAPIGET) {
            await this.kioskService.sendAPITRIGGER(this.token, 'GET', this.urlSendAPIGET, this.his.hn, this.cardCid, servicePoint.local_code, servicePoint.service_point_id, rs.queueNumber);
          }
          if (this.isSendAPIPOST) {
            await this.kioskService.sendAPITRIGGER(this.token, 'POST', this.urlSendAPIPOST, this.his.hn, this.cardCid, servicePoint.local_code, servicePoint.service_point_id, rs.queueNumber);
          }
          if (this.isManual) {
            await this.clearData();
          }
        }
      } else {
        this.alertService.error('ไม่สามารถลงทะเบียนได้');
        this.isPrinting = false;
      }
      this.isClick = false;
    } catch (error) {
      this.isClick = false;
      this.isPrinting = false;
      console.log(error);
    }
  }

  async getNhso(cid) {
    const nhsoToken = this.nhsoToken || localStorage.getItem('nhsoToken');
    const nhsoCid = this.nhsoCid || localStorage.getItem('nhsoCid');
    const data = `<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:tok=\"http://tokenws.ucws.nhso.go.th/\">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <tok:searchCurrentByPID>\n         <!--Optional:-->\n         <user_person_id>${nhsoCid}</user_person_id>\n         <!--Optional:-->\n         <smctoken>${nhsoToken}</smctoken>\n         <!--Optional:-->\n         <person_id>${cid}</person_id>\n      </tok:searchCurrentByPID>\n   </soapenv:Body>\n</soapenv:Envelope>`;
    try {
      if (nhsoToken && nhsoCid) {
        const nhso: any = {};
        const rs: any = await this.kioskService.getNhso(this.token, data);
        rs.results.forEach(v => {
          if (v.name === 'hmain') { nhso.hmain = v.elements[0].text; }
          if (v.name === 'hmain_name') { nhso.hmain_name = v.elements[0].text; }
          if (v.name === 'maininscl') { nhso.maininscl = v.elements[0].text; }
          if (v.name === 'maininscl_main') { nhso.maininscl_main = v.elements[0].text; }
          if (v.name === 'maininscl_name') { nhso.maininscl_name = v.elements[0].text; }
          if (v.name === 'startdate') { nhso.startdate = v.elements[0].text; }
          if (v.name === 'startdate_sss') { nhso.startdate_sss = v.elements[0].text; }
        });
        this.rightName = nhso.maininscl ? `${nhso.maininscl_name} (${nhso.maininscl})` : '-';
        this.rightHospital = nhso.hmain ? `${nhso.hmain_name} (${nhso.hmain})` : '-';
        this.rightStartDate = nhso.startdate ? `${moment(nhso.startdate, 'YYYYMMDD').format('DD MMM ')} ${moment(nhso.startdate, 'YYYYMMDD').get('year')}` : '-';
      }
    } catch (error) {
      console.log(error);
      // this.alertService.error(error.message);
    }
  }

  home() {
    this.router.navigate(['/kiosk/setting']);
  }

  onClickManual() {
    this.cid = '';
    this.status = 'manual';
    this.isManual = true;
  }

  onkeycid(num) {
    if (num === 'x') {
      this.cid = this.cid.substring(0, this.cid.length - 1);
    } else if (num === 'b') {
      this.status = 'offline';
      this.isManual = false;
    } else {
      if (this.cid.length < 13) {
        this.cid = `${this.cid || ''}${num}`;
      }
    }
  }

  async getInfoFromCard() {
    try {
      this.btnGetCard = true;
      const rs: any = await this.nhsoService.getCard();
      if (rs.status === 200) {
        this.cardCid = rs.body.pid;
        this.cardFullName = `${rs.body.fname} ${rs.body.lname}`;
        this.cardBirthDate = moment(rs.body.birthDate, 'YYYYMMDD').format('DD-MM-YYYY');
        if (this.cardCid) {
          await this.getPatient('CID');
          await this.getAuthenCode(rs);
          // await this.getRemed();
          // await this.getNhso(this.cardCid);
          // NHSO
          this.rightName = rs.body.mainInscl ? rs.body.mainInscl : '-';
          this.rightHospital = rs.body.subInscl ? rs.body.subInscl : '-';
          moment.locale('th');
          this.rightStartDate = rs.body.transDate ? `${moment(rs.body.transDate).format('DD MMM ')} ${moment(rs.body.transDate).get('year') + 543}` : '-';
        } else {
          this.alertService.error('บัตรมีปัญหา กรุณาเสียบใหม่อีกครั้ง', null, 1000);
        }
      }
      this.btnGetCard = false;
    } catch (error) {
      this.btnGetCard = false;
      this.getCardOnly2();
    }
  }

  setInterval() {
    // this.getCardOnly();
    this.id = setInterval(() => {
      if ((this.status === 'offline' || this.status === 'online') && !this.isManual) {
        this.getCardOnlyCheck();
      }
      // } else if (this.status == 'ONLINE') {
      //   this.getCardOnlyCheck();
      // }
    }, 1000);
    console.log(this.id);

  }

  async getCardOnlyCheck() {
    try {
      const rs: any = await this.nhsoService.getCardOnly();
      if (rs.status === 200) {
        if (this.status !== 'online') {
          await this.getInfoFromCard();
          // this.cardCid = rs.body.pid;
          // this.cardFullName = `${rs.body.fname} ${rs.body.lname}`;
          // this.cardBirthDate = moment(rs.body.birthDate, 'YYYYMMDD').format('DD-MM-YYYY');
        }
        this.status = 'online';
        return true;
      } else {
        console.log('offline');
        this.clearData();
        return false;
      }
    } catch (error) {
      this.clearData();
      return false;
    }
  }



  async getCardOnly2() {
    const rs: any = await this.nhsoService.getCardOnly();
    if (rs.status === 200) {
      this.cardCid = rs.body.pid;
      this.cardFullName = `${rs.body.fname} ${rs.body.lname}`;
      this.cardBirthDate = moment(rs.body.birthDate, 'YYYYMMDD').format('DD-MM-YYYY');
      this.status = 'online';
      if (this.cardCid) {
        await this.getPatient('CID');
        await this.getRemed();
        await this.getNhso(this.cardCid);
      }
    } else {
      this.alertService.error('บัตรมีปัญหา กรุณาเสียบใหม่อีกครั้ง', null, 1000);
    }
  }

  async getAuthenCode(nhsoInfo: any) {
    try {
      if (nhsoInfo.status === 200) {
        const authenNHSO: any = await this.nhsoService.getAuthenCode(nhsoInfo.body.pid, nhsoInfo.body.correlationId, this.his.hn, '12272');
        if (authenNHSO.status === 200) {
          try {
            await this.nhsoService.save({
              claimCode: authenNHSO.body.claimCode,
              pid: authenNHSO.body.pid,
              createdDate: authenNHSO.body.createdDate
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          await this.getLastToken(nhsoInfo.body.pid);
        }
      }
    } catch (error) {
      await this.getLastToken(nhsoInfo.body.pid);
      console.log(error);
    }
  }

  async getLastToken(cid) {
    try {
      const authenNHSO: any = await this.nhsoService.getLastToken(cid);
      if (authenNHSO.status === 200) {
        await this.nhsoService.save({
          claimCode: authenNHSO.body.claimCode,
          pid: authenNHSO.body.pid,
          createdDate: authenNHSO.body.createdDate
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
