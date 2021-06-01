//static data to don't have to generate the config_data 2 times
const { config } = require("dotenv");
const lodash = require("lodash");
const dotenv = require("dotenv").config();
let config_data = null;

const multiplex = (size) => (e)=>lodash.range(size).map(_=>e);
module.exports = function() {// if the static data was already set. return it
    if(config_data != null && config_data != undefined) {
            return config_data;
    }
    config_data = {};
    //LOAD JSON
    if(process.env.NODE_ENV === undefined || 
       process.env.NODE_ENV == null || 
       process.env.NODE_ENV == 'development') 
    { 
        config_data = require('./config.dev.json');
    } 
    else {
        if(process.env.NODE_ENV == 'production') {
            config_data = require('./config.production.json');
        }
    }
    //LOAD FROM ENV VARIABLES
    //config_data.DATABASE = process.env.DATABASE;
    let sides = ["a","b"];
    let levels=["","_1","_2","_3"];
    let alleys = lodash.range(1,23).flatMap(_=>lodash.zip([_,_],sides)).map(_=>_.join(''));
    let alleys_levels= alleys.flatMap(_=>lodash.zip(multiplex(levels.length)(_),levels)).map(_=>_.join(''));
    config_data.alleys = alleys;
    config_data.alleys_levels = alleys_levels;
    return config_data;
}