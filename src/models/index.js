const {Sequelize, DataTypes} = require('sequelize');
const CONFIG = require("../config/config")();
const db_filepath = process.env.DATABASE;

const sequelize = new Sequelize(
    {
        dialect: 'sqlite'
        ,storage: db_filepath
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
