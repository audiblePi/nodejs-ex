var express = require('express');
var app     = express();
var Stopwatch = require('timer-stopwatch');
var dataRate = 100; //milliseconds
var switchDataRate = 100; //milliseconds
var telemetryData, switchData;
var stopwatch = new Stopwatch(); // A new count up stopwatch. Starts at 0. 
var timer = new Stopwatch(36000000); // A new countdown timer with 60 seconds 
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var ip = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
 
initData();
runDataStream();
runSwitchStream();

app.get('/', (req, res) => res.json({ message: 'telemetry data stream demo' }) );
app.get('/api/telemetry/recent', (req, res) => res.json(telemetryData)); //numerical data from spacesuit sensors
app.get('/api/switch/recent', (req, res) => res.json(switchData)); //telemetry switches driven by numerical data points or other triggers

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

function initData(){
    //console.log("initData");

    stopwatch.start();
    timer.start();
    
    telemetryData = { 
        _id : "5a8ed9a57eb95cd5d2855904", 
        p_suit : 2, 
        t_batt : "10:00:00",
        t_o2 : "10:00:00", 
        t_h2o : "10:00:00", 
        p_sub : 2, 
        t_sub : -148,
        v_fan : 10000, 
        t_eva : "00:00:00", 
        p_o2 : 750, 
        rate_o2 : 0.5, 
        cap_battery : 0, 
        p_h2o_g : 14, 
        p_h2o_l : 14, 
        p_sop : 750, 
        rate_sop : 0.75
    };

    switchData = { 
        _id : "5a8edafa7eb95cd5d2855905", 
        batt_amp_high : false,
        batt_vdc_low : false,
        suit_pressure_low : false,
        sop_on : false, 
        sspe : false, 
        suit_pressure_high : false,
        o2_use_high: false,
        sop_pressure_low: false,
        fan_error : false, 
        vent_error : false, 
        co2_high : false,
        vehicle_power : false, 
        h2o_off : false, 
        o2_off : false 
    };
}

function runDataStream(){
    // console.log("runDataStream");

    //3.2.1 INTERNAL SUIT PRESSURE - [psid]
    //Description: The pressure inside the spacesuit needs to stay within certain limits. 
    //If the suit pressure gets too high, the movement of the astronaut will be heavily reduced if the pressure exceeds nominal limits. 
    //Expected range is from 2 to 4 psid.
    telemetryData["p_suit"] = generateSweep("p_suit", 2, 4, "int");

    //3.2.2 TIME LIFE BATTERY - [time value]
    //Description: The remaining time until the battery of the spacesuit is completely discharged. 
    //Battery life is usually displayed in the format “hh:mm:ss”.
    //Expected range is from 0 to 10 hours.
    telemetryData["t_batt"] = getTime(timer.ms);

    //3.2.3 TIME LIFE OXYGEN - [time value]
    //Description: The remaining time until the available oxygen is depleated. 
    //Time life oxygen is usually displayed in the format “hh:mm:ss”.
    //Expected range is from 0 to 10 hours.
    telemetryData["t_o2"] = getTime(timer.ms);

    //3.2.4 TIME LIFE WATER - [time value]
    //Description: The remaining time until the water resources of the spacesuit are depleted. 
    //Time life water is usually displayed in the format “hh:mm:ss”.
    //Expected range is from 0 to 10 hours.
    telemetryData["t_h2o"] = getTime(timer.ms);

    //3.2.5 SUB PRESSURE - [psia]
    //Description: External Environment pressure. Expected range is from 2 to 4 psia.
    telemetryData["p_sub"] = generateSweep("p_sub", 2, 4, "int");

    //3.2.6 SUB TEMPERATURE - [degrees Fahrenheit]
    //Description: External Environmental temperature measured in degrees Fahrenheit. Temperatures are expected to be standard low earth orbit Day/Night-cycles without anamolies.
    telemetryData["t_sub"] = generateSweep("t_sub", -148, 248, "int");

    //3.2.7 FAN TACHOMETER- [RPM]
    //Description: Speed of the cooling fan. Expected range is from 10000 to 40000 RPM.
    telemetryData["v_fan"] = generateSweep("v_fan", 10000,40000, "int");

    //3.2.8 EXTRAVEHICULAR ACTIVITY TIME - [time value]
    //Description: Stopwatch for the current EVA. EVA’s usually do not exceed a time of 9 hours.
    telemetryData["t_eva"] = getTime(stopwatch.ms);

    //3.2.9 OXYGEN PRESSURE - [psia]
    //Description: Pressure inside the Primary Oxygen Pack. Expected range is from 750 to 950 psia.
    telemetryData["p_o2"] = generateSweep("p_o2", 750, 950, "int");

    //3.2.10 OXYGEN RATE - [psi/min]
    //Description: Flowrate of the Primary Oxygen Pack. Expected range is from 0.5 to 1 psi/min.
    telemetryData["rate_o2"] = generateSweep("rate_o2", 0.5, 1, "dec");

    //3.2.11 BATTERY CAPACITY - [amp-hr]
    //Description: Total capacity of the spacesuit’s battery. Expected range is from 0 to 30 amp-hr.
    telemetryData["cap_battery"] = generateSweep("cap_battery", 0, 30, "int");

    //3.2.12 H2O GAS PRESSURE - [psia]
    //Description: Gas pressure from H2O system. Expected range is from 14 to 16 psia.
    telemetryData["p_h2o_g"] = generateSweep("p_h2o_g", 14, 16, "int");

    //3.2.13 H2O LIQUID PRESSURE - [psia]
    //Description: Liquid pressure from H2O system. Expected range is from 14 to 16 psia.
    telemetryData["p_h2o_l"] = generateSweep("p_h2o_l", 14, 16, "int");

    //3.2.14 SOP PRESSURE - [psia]
    //Description: Pressure inside the Secondary Oxygen Pack. Expected range is from 750 to 950 psia.
    telemetryData["p_sop"] = generateSweep("p_sop", 750, 950, "int");

    //3.2.15 SOP RATE - [psi/min]
    //Description: Flowrate of the Secondary Oxygen Pack. Expected range is from 0.5 to 1 psi/min.
    telemetryData["rate_sop"] = generateSweep("rate_sop", 0.5, 1, "dec");

    setTimeout(runDataStream, dataRate);
}

function runSwitchStream(){
    //console.log("runSwitchStream");
    
    //Battery amp high
    //Current of the battery is above maximum levels. Amps
    //Trigger: >4 amp

    //Battery vdc low
    //Voltage of the battery is below minimum levels. Volts
    //Trigger: <15 V
    
    //Suit pressure low
    //Spacesuit pressure is below minimum levels. Psid
    //Trigger: <2
    switchData["suit_pressure_low"] = (telemetryData["p_suit"] < 2) ? true : false;

    //SOP on
    //Secondary Oxygen Pack is active
     
    //Spacesuit pressure emergency
    //Spacesuit pressure
    
    //Spacesuit pressure high
    //Spacesuit pressure is above maximum levels. Psid
    //Trigger: >5 psid
    switchData["suit_pressure_high"] = (telemetryData["p_suit"] > 5) ? true : false;

    //O2 use high
    //Oxygen usage exceeds normal use. Psi/min
    //Trigger: >1 psi/min
    
    //SOP pressure low
    //Secondary Oxygen Pressure is below minimum levels. Psia
    //Trigger: <700 psia
    switchData["sop_pressure_low"] = (telemetryData["p_sop"] < 750) ? true : false;

    //Fan failure
    //Cooling fan of the spacesuit has a failure
    switchData["vent_error"] = (telemetryData["v_fan"] < 10000) ? true : false;

    //No vent flow
    //No ventilation flow is detected

    //CO2 high
    //Carbon dioxide levels are above maximum levels. PPM
    //Trigger: >500 ppm
    
    // Vehicle power present
    //Spacesuit is receiving power through spacecraft

    //H2O is off
    //H2O system is offline

    //O2 is off
    //O2 system is offline

    setTimeout(runSwitchStream, switchDataRate);
}

//sweep from min to max to min +/- 10%
function generateSweep(key, min, max, type){
    var currentValue = telemetryData[key];
    
    switch (type){
        case "int":
            currentValue = (currentValue < (max+5) ) ? (currentValue + 1) : (min);
            break;
        case "dec":
            currentValue = (currentValue < (max*1.1) ) ? (currentValue + .01) : (min*.9);
            currentValue = Math.round(currentValue * 100 ) / 100;
            break;
        default:
            currentValue = -777777;
    }

    return currentValue;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getTime(ms){
    var hours = Math.floor(ms / 3600000); // 1 Hour = 36000 Milliseconds
    var minutes = Math.floor((ms % 3600000) / 60000); // 1 Minutes = 60000 Milliseconds
    var seconds = Math.floor(((ms % 360000) % 60000) / 1000); // 1 Second = 1000 Milliseconds

    hours = (hours < 10) ? "0"+hours : hours;
    minutes = (minutes < 10) ? "0"+minutes : minutes;
    seconds = (seconds < 10) ? "0"+seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

module.exports = app ;
