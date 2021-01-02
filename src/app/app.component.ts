import { Component, OnInit } from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
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
  total: PrecinctVoterData;
  public selectedColumn: string = "giarrussoPercent";
  public columns: string[] = [];
  constructor(private http: HttpClient, private dataService: MapDataService) {}
  public precincts: Precinct[] = [];
  precintGeoJson: L.GeoJSON<any>;

  private svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>';
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
  private dataLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
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
        this.setPrecinctLayers();
      }
    });
    this.loadPrecinctData();
  }

  public precinctUrl: string =
    "https://opendata.arcgis.com/datasets/ca0f4261673541d798551f5cddc54bd6_0.geojson";

  public sheetUrl = "1syXU60xTSCtHoePb7Yobh892SfdNTlYp1zuxyLPOtQg";

  setPrecinctLayers() {
    let districtA = this.DistrictAPrecincts;
    let selectedColumn = this.selectedColumn;
    let prs: Precinct[] = this.precincts;
    // Load geojson file
    this.http.get(this.precinctUrl).subscribe((json: any) => {
      let eachFunc = function(f, l) {
        const precinctId = f.properties.PRECINCTID;
        let pr: Precinct = prs[precinctId];
        if (!pr) {
          pr = { id: precinctId };
        }
        pr.feature = f;
        pr.layer = l;
        if (districtA.includes(precinctId)) {
          //style layer & bind popup
          pr.layer["options"].weight = 1;
          let amount: number = pr.data[selectedColumn];
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
          pr.layer["options"].fillColor =
            "rgb(" + Math.round(red) + "," + Math.round(green) + ",0)";
          pr.layer["options"].fillOpacity = 0.8;
          pr.layer.bindPopup(`<pre>${JSON.stringify(pr.data, null, 2)}</pre>`);
        } else {
          pr.layer["options"].weight = 0;
        }
      };

      this.precintGeoJson = L.geoJSON(json, {
        onEachFeature: eachFunc
      });
      this.precintGeoJson.setStyle({
        color: "black"
      });
      this.precincts = prs;
      this.precintGeoJson.addTo(this.map);
    });
  }

  precinctVoterData: PrecinctVoterData[];

  loadPrecinctData() {
    this.dataService.fetchDataFromSheet(this.sheetUrl).subscribe(results => {
      this.precinctVoterData = results;
      for (let i = 0; i < this.precinctVoterData.length; ++i) {
        let voterData = this.precinctVoterData[i];
        if (voterData.precinct == "Total") {
          this.total = voterData;
          this.columns = Object.keys(voterData);
          this.selectedColumn = this.columns[0];
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

  public valueSelected() {
    this.setPrecinctLayers();
  }
  /**
   * NTH
   * * hide some of the leaflet rendering
   * * pretty up the interface
   * * pull & parse voter data directly from SOS website - https://voterportal.sos.la.gov/static/ and select from dropdowns
   * * display overlays from other city maps
   * * pull in addresses to display on map?
   * *
   */
}
