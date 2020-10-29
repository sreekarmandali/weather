import { Component, OnInit } from '@angular/core';
import {FormControl} from '@angular/forms'
import {HttpClient,HttpParams} from '@angular/common/http'
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators'

import * as d3 from 'd3';
import * as d3Scale from 'd3';
import * as d3Shape from 'd3';
import * as d3Array from 'd3';
import * as d3Axis from 'd3';


export interface City {
   "id": BigInteger,
    "name": String,
    "state": String,
    "country": String,
    "coord": {
      "lon":number,
      "lat":number
      
    }
 }
 export interface Weather {
  "current":any,
  "daily":any,
  "hourly":any
}
@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {

  title = 'materialApp';
  searchData = new FormControl('Mumbai,Maharashtra');
  cityData:any=[];
  flteredCityData:Observable<City[]>
  weatherData:Weather;
  currentGrid:any;
  graphData=[];
  graphArea:any;

image={
  "Clear":"../../assets/images/sky.png",
"Clouds":"../../assets/images/cloudy.png",
"Rain":"../../assets/images/rain.png",
"Mist":"../../assets/images/mist.png",
"Sunny":"../../assets/images/sunny.png"



}

  
  constructor(private http:HttpClient){
     
  }
  //build list of states as map of key-value pairs
  

  ngOnInit(): void {
     this.http.get('../../assets/city.list.json').subscribe(data=>{
        this.cityData=data;
        this.weatherApi([...this.cityData.filter(x=>x.state==='Maharashtra'&& x.name==='Mumbai')][0])

        
        
     });
     
     this.flteredCityData = this.searchData.valueChanges
      .pipe(
       
        startWith(''),
        map(value => typeof value === 'string' ? value : value.name),
        map(name => name ? this._filter(name) : this.cityData.slice())
      );

      this.searchData.valueChanges.subscribe(
        (value) => {
          this.flteredCityData.subscribe(data=>{
            if(value.includes(',')){
              let a=data.filter(x=>x.name===value.split(',')[0] && x.state===value.split(',')[1]);
              if(a.length!==0){
                this.weatherApi(a[0]);
              }
            }
          })
            
        }
   );



     
  }
  
  
  weatherApi(city:City){
    

    this.http.get('https://api.openweathermap.org/data/2.5/onecall?lat='+city.coord.lat+'&lon='+city.coord.lon+'&exclude=minutely&appid=f23ee3c61632e9ae022661c57813fc88&units=metric').subscribe(x=>{
    this.weatherData=undefined;  
    this.weatherDataFormation(x)})
  }
 private _filter(name: string): City[] {
   const filterValue = name.toLowerCase();

   return this.cityData.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
 }
 callaFunction(){
   console.log(this.searchData)
 }
 weatherDataFormation(data){
   console.log(data)
data.current.dt=new Date(data.current.dt*1000)
data.current.sunrise=new Date(data.current.sunrise*1000)
data.current.sunset=new Date(data.current.sunset*1000)

data.daily=data.daily.map(x => {
  x.dt=new Date(x.dt*1000);
x.sunrise=new Date(x.sunrise*1000);
  x.sunset=new Date(x.sunset*1000);
  return x;
}

);

data.hourly=data.hourly.map(x => {
  x.dt=new Date(x.dt*1000);

  return x;
});
this.weatherData={"current":data.current,"daily":data.daily.sort((a, b)=> {
  var c = new Date(a);
  var d = new Date(b);
  if(c>d)
  return -1
  else
  return 1;
}),...this.weatherData};

this.weatherData.hourly={}
this.currentGrid=this.weatherData.daily[0];


data.daily.forEach(x => {
  console.log( x.dt.toString().slice(0,15))
  this.weatherData["hourly"][ x.dt.toString().slice(0,15)]=data.hourly.filter(y=> y.dt.toString().slice(0,15)=== x.dt.toString().slice(0,15));
});
this.getHourlyGraph();





console.log(this.weatherData)
console.log(this.currentGrid)

 }

 getHourlyGraph(){
  this.graphData=[];
  let newDate=new Date();
  this.weatherData.hourly[this.currentGrid.dt.toString().slice(0,15)].forEach(x => {
    if(newDate.getHours()===x.dt.getHours()){
      this.currentGrid.currentTemp=x.temp;
      this.currentGrid.currentWeather=x.weather[0].main;
    }
  });
  
   
   this.weatherData.hourly[this.currentGrid.dt.toString().slice(0,15)].forEach(x => {
     this.graphData.push({hour:x.dt.getHours(),value:x.temp})
     
   });
   console.log(this.graphData)
   this.draw();
  
 }
 draw() {
  
  

  let svg = d3.select("svg");
  svg.selectAll("*").remove();
  
  
   let margin = {top: 20, right: 20, bottom: 30, left: 50};
 let  width = +svg.attr("width") - margin.left - margin.right;
  let height = +svg.attr("height") - margin.top - margin.bottom;
  let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   
    
    let x = d3.scaleLinear()
        .rangeRound([0, width]);
    
    let y = d3.scaleLinear()
        .rangeRound([height, 0]);
    
    let line = d3.line()
        .x(function(d) { return x(d.hour); })
        .y(function(d) { return y(d.value); });
    
    
    
      x.domain(d3.extent(this.graphData, function(d) { return d.hour; }));
      y.domain(d3.extent(this.graphData, function(d) { return d.value; }));
    
      g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
        ;
    
      g.append("g")
          .call(d3.axisLeft(y))
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("celsius").select(".domain")
          .remove();
    
      g.append("path")
          .datum(this.graphData)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);
    
}
}
