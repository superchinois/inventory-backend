const {Sequelize, DataTypes} = require('sequelize');
const path = require('path');
const CONFIG = require("../config/config")();
const db_directory = CONFIG.sqlite_db_directory;
const db_file = process.env.DATABASE || "inventory.db";

const sequelize = new Sequelize(
    {
        dialect: 'sqlite'
        ,storage: path.join(db_directory, db_file)
        ,logging: false
    },
);

const models = {
    InventoryItem: require('./inventoryItem.js')(sequelize, DataTypes)
};

Object.keys(models).forEach((key)=>{
    if('associate' in models[key]){
        models[key].associate(models)
    }
});

module.exports = {models, sequelize, DataTypes};
