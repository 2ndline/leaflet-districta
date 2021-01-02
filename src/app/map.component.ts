import { Component, OnInit } from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";
import { HttpClient } from "@angular/common/http";
import { GoogleSheetsDbService } from "ng-google-sheets-db";
import { BehaviorSubject, Observable } from "rxjs";
import {
  characterAttributesMapping,
  PrecinctVoterData
} from "./models/precinct-voter-data.model";
import { Precinct } from "./models/precinct.model";
import { MapDataService } from "./services/map-data.service";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  map: L.Map;
  markers: L.Marker[] = [];
  constructor(private http: HttpClient, private dataService: MapDataService) {}
  public precincts: Precinct[] = [];
  precintGeoJson: L.GeoJSON<any>;

  svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>';
  iconUrl = "data:image/svg+xml;base64," + btoa(this.svg);
  public DistrictAPrecincts: string[] = [
    "14-13A",
    "5-8",
    "17-14",
    "7-12",
    "17-12",
    "17-6",
    "17-11",
    "5-9",
    "17-20",
    "14-12",
    "17-9",
    "17-13",
    "17-3",
    "3-18",
    "17-16",
    "3-19",
    "17-7",
    "17-4",
    "17-5",
    "14-10",
    "17-8",
    "7-18",
    "17-19",
    "16-3",
    "14-17",
    "3-20",
    "3-14",
    "16-6",
    "5-12",
    "16-1",
    "16-2",
    "16-7",
    "17-13A",
    "17-10",
    "16-4",
    "17-15",
    "14-16",
    "5-10",
    "4-11",
    "4-8",
    "4-15",
    "14-11",
    "17-17",
    "14-19",
    "4-7",
    "4-9",
    "14-18A",
    "17-18A",
    "14-5",
    "14-20",
    "17-2",
    "5-16",
    "14-4",
    "5-11",
    "17-1",
    "4-21",
    "4-18",
    "4-17",
    "16-1A",
    "16-8",
    "5-15",
    "14-14",
    "7-17",
    "14-8",
    "17-18",
    "14-21",
    "6-8",
    "14-2",
    "14-1",
    "4-20",
    "6-9",
    "14-3",
    "16-5",
    "4-14",
    "4-17A",
    "14-9",
    "14-15",
    "5-13",
    "14-7",
    "14-6"
  ];
  dataLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  ngOnInit() {
    this.init();
  }

  init() {
    this.dataLoaded.subscribe(e => {
      if (e) {
        this.map = new L.Map("map", {
          layers: [
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              subdomains: ["a", "b", "c"],
              maxZoom: 19
            })
          ],
          center: new L.LatLng(29.97, -90.06),
          zoomControl: false,
          zoom: 12
        });
        this.setPrecinctLayers("giarrussoPercent");
      }
    });
    this.loadPrecinctData();
  }

  setPrecinctLayers(columnForValue: string) {
    let districtA = this.DistrictAPrecincts;
    let prs: Precinct[] = this.precincts;
    // Load geojson file
    this.http
      .get(
        "https://opendata.arcgis.com/datasets/ca0f4261673541d798551f5cddc54bd6_0.geojson"
      )
      .subscribe((json: any) => {
        let eachFunc = function(f, l) {
          const precinctId = f.properties.PRECINCTID;
          let pr = prs[precinctId];
          pr.feature = f;
          pr.layer = l;
          if (districtA.includes(precinctId)) {
            pr.layer["options"].weight = 1;
            pr.layer.bindPopup(this.getPopupForPrecinct(pr));
            let amount: number = pr.data[columnForValue];
            pr.layer["options"].fillColor = this.getColorForPercent(amount);
            pr.layer["options"].fillOpacity = 0.8;
          } else {
            pr.layer["options"].weight = 0;
          }
        };

        this.precintGeoJson = L.geoJSON(json, {
          onEachFeature: eachFunc
        });
        this.precintGeoJson.setStyle({
          color: "black",
          fillColor: "white"
        });
        this.precincts = prs;
        this.precintGeoJson.addTo(this.map);
      });
  }

  getPopupForPrecinct(precinct: Precinct): string {
    var popupContent = precinct.id;
    if (precinct.data) {
      popupContent = JSON.stringify(precinct.data, null, 2);
    }
    return `<pre>${popupContent}</pre>`;
  }

  precinctVoterData: PrecinctVoterData[];

  loadPrecinctData() {
    this.dataService
      .fetchDataFromSheet("1syXU60xTSCtHoePb7Yobh892SfdNTlYp1zuxyLPOtQg")
      .subscribe(results => {
        this.precinctVoterData = results;
        for (let i = 0; i < this.precinctVoterData.length; ++i) {
          let voterData = this.precinctVoterData[i];
          if (voterData.precinct == "Total") {
            continue;
          }
          //make sure precinct values have no leading 0s
          let precinctNumbers: string[] = voterData.precinct.split(" ");
          let suffix = precinctNumbers[1].includes("A") ? "A" : "";
          let id =
            Number(precinctNumbers[0]) +
            "-" +
            Number(precinctNumbers[1].replaceAll("A", "")) +
            suffix;

          this.precincts[id] = { id: id, data: voterData };
        }
        this.dataLoaded.next(true);
      });
  }

  getColorForPercent(amount: number): string {
    let red = 255;
    let green = 0;

    if (amount >= 0.5) {
      let diff = 1 - amount;
      red = 510 * diff;
      green = 255;
    } else {
      green = 510 * amount;
      red = 255;
    }
    return "rgb(" + Math.round(red) + "," + Math.round(green) + ",0)";
  }

  /**
   * TODO:
   * 1) Fix defect where some columns aren't loading (bernieLiz,registeredVoters )
   * 2) Add nav header & filters form with the following: https://jsfiddle.net/xf4fwwme/44/
   *    a) Spreadsheet URL to load data from
   *    b) Which data element to color code (from the data columns)
   * 3) render precincts different if they aren't a part of the data set
   */

  /**
   * NTH
   * * hide some of the leaflet rendering
   * * pull & parse voter data directly from SOS website - https://voterportal.sos.la.gov/static/
   * * display overlays from other city maps
   * * pull in addresses to display on map?
   * *
   */
}
