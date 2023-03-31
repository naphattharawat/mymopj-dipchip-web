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
    // let _httpOptions = {};

    // if (token) {
    //   _httpOptions = {
    //     headers: new HttpHeaders({
    //       'Content-Type': 'application/json',
    //       'Authorization': 'Bearer ' + token
    //     })
    //   };
    // } else {
    //   _httpOptions = this.httpOptions;
    // }

    return this.httpClient.get(_url).toPromise();
  }

}
