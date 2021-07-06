const {Op} = require('sequelize');
const CONFIG = require("../config/config")();
const FIELDNAMES=CONFIG.FIELDNAMES;

function defineItemModel(sequelize, DataTypes){
    let fields = FIELDNAMES;
    let firstFloatType = CONFIG.firstFloatType;
    let textFields=fields.slice(0,firstFloatType);
    let numberFields=fields.slice(firstFloatType);
    let definition = Object.assign(
        textFields.reduce((acc, f)  => Object.assign(acc, {[f]: DataTypes.TEXT}), new Object()),
        numberFields.reduce((acc, f)=> Object.assign(acc, {[f]: DataTypes.FLOAT}), new Object()),
    );
    return sequelize.define('item', definition);
}

const inventoryItem = (sequelize, DataTypes) =>{
    const InventoryItem = defineItemModel(sequelize, DataTypes);
    InventoryItem.findByItemcode = async (itemcode) => {
        let item = await InventoryItem.findOne({where:{itemcode: itemcode}});
        return item;
    };
    InventoryItem.findAllItems = async (whereClause) =>{
        let items=[];
        if(whereClause.length>0){
            items = await InventoryItem.findAll({where:{[Op.and]:whereClause}});
        }
        else {
            items = await InventoryItem.findAll();
        }
        return items;
    };
    InventoryItem.findByName = async (partialName) =>{
        return InventoryItem.findAll({where:{itemname:{[Op.like]:`%${partialName}%`}}});
    };
    return InventoryItem;
}

module.exports = inventoryItem;
