import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { GoogleSheetsDbService } from "ng-google-sheets-db";

import { AppComponent } from "./app.component";
import { PopupComponent } from "./components/popup/popup.component";

@NgModule({
  imports: [BrowserModule, FormsModule, HttpClientModule],
  declarations: [AppComponent, PopupComponent],
  providers: [GoogleSheetsDbService],
  bootstrap: [AppComponent]
})
export class AppModule {}
