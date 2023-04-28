import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class KioskService {

  token: any;
  httpOptions: any;
  constructor(@Inject('API_URL') private apiUrl: string, private httpClient: HttpClient) {
    this.token = localStorage.getItem('token');
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.token
      })
    };
  }

  async getSession(cid) {
    const _url = `${this.apiUrl}/qr?cid=${cid}`;
    return this.httpClient.get(_url).toPromise();
  }

  async register(cid, fname, lname, email, tel, password) {
    const _url = `https://members.moph.go.th/api/v1/m/register`;
    return this.httpClient.post(_url, {
      cid,
      first_name: fname,
      last_name: lname,
      password: password,
      email: email,
      telephone: tel
    }).toPromise();
  }

  async verify(accessToken, sessionId) {
    const _url = `https://api-mymoph.moph.go.th/dipchip-direct/dipchip/v2`;
    return this.httpClient.post(_url, {
      access_token: accessToken,
      session_id: sessionId
    }).toPromise();
  }

  async login(username, password) {
    const _url = `https://members.moph.go.th/api/v1/m/oauth/token`;
    return this.httpClient.post(_url, {
      clientId: 'AxSJdRBwkoAnTChdGJsR',
      username: username,
      password: password
    }).toPromise();
  }

  async hrstatus(cid) {
    const _url = `${this.apiUrl}/status?cid=${cid}`;
    return this.httpClient.get(_url).toPromise();
  }

}
