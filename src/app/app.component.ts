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
import { MapColumn } from "./models/mapColumn";
import { DistrictAPrecincts } from "./models/districtAprecincts";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  map: L.Map;
  markers: L.Marker[] = [];
  total: PrecinctVoterData;
  public selectedColumn: MapColumn;
  public selectedColumnOption: string;
  constructor(private http: HttpClient, private dataService: MapDataService) {}
  public precincts: Precinct[] = [];
  precintGeoJson: L.GeoJSON<any>;

  private svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>';

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

  drawMap() {
    var selectedColumn = this.selectedColumn;
    var prs = this.precincts;
    let eachFunc = function(f, l) {
      const precinctId = f.properties.PRECINCTID;
      let pr: Precinct = prs[precinctId];
      if (!pr) {
        pr = { id: precinctId };
      }
      pr.feature = f;
      pr.layer = l;
      if (DistrictAPrecincts.includes(precinctId)) {
        //style layer & bind popup
        pr.layer["options"].weight = 1;
        let amount: number = pr.data[selectedColumn.id];
        if (selectedColumn.columnType === "total") {
          let red = 255;
          let green = 0;
          let blue = 0;
          //TODO - calculate RGB for totals
          pr.layer["options"].fillColor = `"rgb(${Math.round(
            red
          )}, ${Math.round(green)}, ${Math.round(blue)})`;
          pr.layer["options"].fillOpacity = 0.8;
        } else if (selectedColumn.columnType === "average") {
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
        }

        pr.layer.bindPopup(`<pre>${JSON.stringify(pr.data, null, 2)}</pre>`);
      } else {
        pr.layer["options"].weight = 0;
      }
    };

    if (this.precintGeoJson) {
      this.precintGeoJson.remove();
    }

    this.precintGeoJson = L.geoJSON(this.json, {
      onEachFeature: eachFunc
    });
    this.precintGeoJson.setStyle({
      color: "black"
    });
    this.precincts = prs;
    this.precintGeoJson.addTo(this.map);
  }

  json: any;

  setPrecinctLayers() {
    let selectedColumn = this.selectedColumn;
    let totalColumn = this.total;
    let prs: Precinct[] = this.precincts;
    // Load geojson file
    this.http.get(this.precinctUrl).subscribe((json: any) => {
      this.json = json;
      this.drawMap();
    });
  }

  precinctVoterData: PrecinctVoterData[];
  columns: MapColumn[] = [];

  loadPrecinctData() {
    this.dataService.fetchDataFromSheet(this.sheetUrl).subscribe(results => {
      this.precinctVoterData = results;
      for (let i = 0; i < this.precinctVoterData.length; ++i) {
        let voterData = this.precinctVoterData[i];
        if (voterData.precinct == "Total") {
          this.total = voterData;
          this.columns = [];
          Object.keys(voterData).forEach(column => {
            this.columns.push({
              id: column,
              columnType:
                voterData[column] === "Total"
                  ? "header"
                  : voterData[column] < 1
                  ? "average"
                  : "total",
              average: voterData[column] < 1 ? voterData[column] : 0.0,
              total: voterData[column] > 1 ? voterData[column] : null,
              min: voterData[column] < 1 ? 0 : null,
              max: voterData[column] < 1 ? 0 : null
            });
          });
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
        Object.keys(voterData).forEach(column => {
          if (voterData[column].columnType === "total") {
            if (this.columns[column].min > voterData[column]) {
              this.columns[column].min = voterData[column];
            }
            if (this.columns[column].min > voterData[column]) {
              this.columns[column].min = voterData[column];
            }
          }
        });
      }
      this.dataLoaded.next(true);
    });
  }

  public valueSelected() {
    this.selectedColumn = this.columns.find(
      x => x.id === this.selectedColumnOption
    );
    this.drawMap();
  }
}
