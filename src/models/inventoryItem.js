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
    return InventoryItem;
}

function batchInsertIfNotExists(itemModel, items){
    let foundPromises = items.map(item=> itemModel.findOne({where:{itemcode:item.itemcode}}));
    let resolved = Promise.all(foundPromises);
    resolved
    .then(resolvedItems => {
        let filtered = items.filter((_, index)=>!resolvedItems[index]);
        itemModel.bulkCreate(filtered);
    })
    .catch(err=>console.error(err));
}

function batchUpdateExisting(itemModel, items){
    let foundPromises = items.map(item=> itemModel.findOne({where:{itemcode:item.itemcode}}));
    let resolved = Promise.all(foundPromises);
    resolved
    .then(resolvedItems => {
        resolvedItems.forEach((item, index)=>{
            if(item){
                item.update(items[index])
            }
        });
    })
    .catch(err=>console.error(err));
}

module.exports = inventoryItem;
