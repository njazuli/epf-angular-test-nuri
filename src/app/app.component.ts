
import { ChangeDetectorRef, Component, TemplateRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { combineLatest, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderPipe } from 'ngx-order-pipe';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

/// <reference types="@types/googlemaps" />

export class AppComponent implements OnInit {
  config: any;
  title = 'nuri-test-app';
  officeArr: any = [];
  statesArr: any = [];
  location: any = [];
  modalRef: BsModalRef;
  subscriptions: Subscription[] = [];
  messages: string[] = [];
  searchInput: any;
  order: string = 'officeArr.nam';
  reverse: boolean = true;
  // for modal
  modalDetails: any = [];
  sortedCollection: any[];
  zoom: number = 8;

  // dropdownsetting
  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings;

  constructor(private http: HttpClient,private modalService: BsModalService, private changeDetection: ChangeDetectorRef,private route: ActivatedRoute, private router: Router,private orderPipe: OrderPipe) { 
    this.config = {
      currentPage: 1,
      itemsPerPage: 10
    };
    
    route.queryParams.subscribe(
    params => this.config.currentPage= params['page']?params['page']:1 );

  }

  ngOnInit() {      
      // Simple POST request with a JSON body and response type <any>
      this.http.post<any>('https://secure.kwsp.gov.my/m2/postBranchLocation', { "ios":"100", "lan":"EN","ver":"100"}).subscribe(data => {
          // console.log(JSON.stringify(data,null,2))
          this.officeArr = data.lis;
          
          this.getLocation();

          this.officeArr = this.orderPipe.transform(this.officeArr, 'officeArr.nam');
      })

      this.http.get("assets/data/StatesCode.json").subscribe(data =>{
        // console.log(data);
        this.statesArr = data;
      })

      this.dropdownList = [this.statesArr];
      this.selectedItems = [
      ];
      this.dropdownSettings = {
          singleSelection: false,
          idField: 'key',
          textField: 'value',
          selectAllText: 'Select All',
          // unSelectAllText: 'UnSelect All',
          itemsShowLimit: 3,
          allowSearchFilter: true
      };
            
  }

  ngAfterViewInit(){
    
  }

  ngOnChanges(){

  }

  reloadOfficeArr(res){
    console.log('in' + res)
    this.http.post<any>('https://secure.kwsp.gov.my/m2/postBranchLocation', { "ios":"100", "lan":"EN","ver":"100"}).subscribe(data => {
        // console.log(JSON.stringify(data,null,2))
        this.officeArr = data.lis;
        
        this.getLocation();

        this.officeArr = this.orderPipe.transform(this.officeArr, 'officeArr.nam');

        this.officeArr = this.officeArr.filter(obj => res.includes(obj.ste));
    })


  }

  selectOptions:any = [];
  resultArr:any = [];
  onItemSelect = (item: any) => {
    
    this.selectOptions.push(item.key);

    if(this.selectOptions.length > 1){
      this.reloadOfficeArr(this.selectOptions);
    }else{
      this.officeArr = this.officeArr.filter(res =>{
        return res.ste.match(item.key);
      });
    }
   
  } 

  onSelectAll(items: any) {
    this.ngOnInit();
  }

  onItemDeSelect(items: any) {
    this.selectOptions = this.selectOptions.filter(function( obj ) {
      return obj !== items.key;
    });
    
    if(this.selectOptions.length == 0){
      this.ngOnInit();
    }else{
      this.reloadOfficeArr(this.selectOptions);
    }
    
    
  }

  onDeSelectAll(items: any) {
    this.ngOnInit();
  }

  setOrder(value: string) {
    if (this.order === value) {
      this.reverse = !this.reverse;
    }

    this.order = value;
  }

  // method
  Search = () => {
    if(this.searchInput == ""){
      this.ngOnInit();
    }else{
      this.officeArr = this.officeArr.filter(res =>{
      return res.nam.toLocaleLowerCase().match(this.searchInput.toLocaleLowerCase()) || res.ads.toLocaleLowerCase().match(this.searchInput.toLocaleLowerCase());
      });
    }
  }

  // key:string = '';
  // reverse: boolean = false;
  // sort(key){
  //   this.key = key;
  //   this.reverse = !this.reverse;
  // }

  pageChange(newPage: number) {
    this.router.navigate([''], { queryParams: { page: newPage } });
    window.scroll(0,0);
  }

  filterStates(code){
    let states = this.statesArr;
    let state;
    states.forEach(items => {
      if(code == items.key){
        state = items.value;
      }
    });

    return state;
  }

  // getlocation
  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition);
    }else{
      // block gps geolocation
      // 3.1390° N, 101.6869° E
      console.log('block location')
      this.location = {
        userLat : 3.1390,
        userLong : 101.6869
      }

      this.officeArr.forEach(items => {
        let distance;
        
        distance = this.getDistance( items.lat, items.lon, this.location.userLat,  this.location.userLong, 'K' )
  
        items.distance = distance.toString();
        if(distance > 1){
          items.distanceWithKMorM = distance.toFixed(2) + 'KM';
        }else{
          items.distanceWithKMorM = distance.toFixed(2) + 'M';
        }
        
      });
    }
  }
  
  showPosition = (position) => {
    var self = this;
    

    self.location = {
      userLat : position.coords.latitude,
      userLong : position.coords.longitude
    }


    self.officeArr.forEach(items => {
      let distance;
      
      distance = self.getDistance( items.lat, items.lon, position.coords.latitude,  position.coords.longitude, 'K' )

      items.distance = distance.toString();
      if(distance > 1){
        items.distanceWithKMorM = distance.toFixed(2) + 'KM';
      }else{
        items.distanceWithKMorM = distance.toFixed(2) + 'M';
      }
      
    });


  }

  // get distance
  getDistance(lat1, lon1, lat2, lon2, unit) {
    let result;
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { 
        dist = dist * 1.609344;
        result = dist;
        // if(dist > 1){
        //   result = dist.toFixed(2) + ' KM';
        // }else{
        //   result = dist.toFixed(2) + ' M';
        // }
      }
      // if (unit=="N") { dist = dist * 0.8684 }
      // return dist.toFixed(2);

      return dist;
    }
  }



  openModal = (template: TemplateRef<any>, obj) => {
    this.modalRef = this.modalService.show(template);


    this.modalDetails = {
      lat: obj.lat,
      long: obj.lon,
      address:obj.ads,
      distance: obj.distanceWithKMorM,
      fax: obj.fax,
      name: obj.nam,
      link: 'https://www.google.com.my/maps/place/'+obj.lat+','+obj.lon
    }
  }
 
  unsubscribe() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }

  goToLink(url: string){
      window.open(url, "_blank");
  }
}


// AIzaSyAAlzfpqyJVyCRtgTLxfjs5_Mw9y31Ewko