const express = require('express');
const router = express.Router();
const {models} = require('../models/index');
const CONFIG = require("../config/config")();
const lodash = require("lodash");
const { Op } = require("sequelize");
const R = require("ramda");
const winston = require('winston');
const events = require("events");

const eventEmitter = new events.EventEmitter();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'})
    ,winston.format.json()
    //,winston.format.printf(info => `${info.timestamp} [${info.level}]: ${JSON.stringify(info.message, null, 2)}`)
    ),
  transports: [
    new winston.transports.File({filename: "combined.log"})
  ],
});

eventEmitter.on('bulk.put',(payload) => {
  logger.log({level:"info", message:`uptated items count: ${payload.length}`, payload: payload});
})

const ItemInventory = models.InventoryItem;
const isoStringDate = (date) => date.toISOString().split("T")[0];

router.get('/api/buildings', async (req, res)=>{
  res.send(CONFIG.buildings);
});

router.get('/api/alleys', async (req, res)=>{
  res.send(CONFIG.alleys);
});
router.get('/api/alleys_levels', async (req, res)=>{
  let whereClause = [];
  if("building" in req.query) whereClause = [{building: req.query["building"]}];
  let items = await ItemInventory.findAllItems(whereClause);
  let locations = new Set(items.map(_=>_.location));
  res.send(lodash.sortBy(Array.from(locations), _=>parseInt(_.split(/[ab]/)[0])));
  //res.send(CONFIG.alleys_levels);
});

router.get('/api/items/last_updated', async (req, res)=>{
  let fromDate = isoStringDate(new Date());
  if (req.query["from-date"]) fromDate = req.query["from-date"];
  let updated_items = await ItemInventory.findAll({where:{updatedAt:{[Op.gte]:fromDate}}});
  return res.status(200).send(updated_items);
});

router.get('/api/items/:item_id(\\d+)', async (req, res) => {
  let foundOne = await ItemInventory.findByPk(req.params.item_id);
  if (foundOne){
    res.send(foundOne);
  }
  else {res.send({})}
});

router.get('/api/items', async (req, res) => {
  let whereClause=[];
  let filters = ["building","location","detail_location", "itemcode"];
  whereClause=filters.reduce((acc, f)=>{
    let query_value = req.query[f];
    if(query_value){
      let clause = {[f]:query_value};
      return [...acc, clause]
    }
    else return acc;
  },[])
  let filtered = await ItemInventory.findAllItems(whereClause);
  filtered.sort((a,b)=>{return parseInt(a.position)<parseInt(b.position)});
  if(req.query["itemname"]){
    let partialName = req.query["itemname"];
    filtered = filtered.filter(_=>_.itemname.toLowerCase().includes(partialName.toLowerCase()));
  }
  res.send(filtered);
});

router.post('/api/items', async (req, res)=>{
  try {
    const item = await ItemInventory.create(req.body);
    return res.status(201).json({
      item,
    });
} catch (error) {
    return res.status(500).json({ error: error.message })
}
});

router.put('/api/bulk/items', async (req, res) => {
  try{
    /**
     * items : [{id: "_id_", values:{onhand:"_onhand_", counted: -1, ...}}, ...]
     */
    let items = [];
    if ("items" in req.body){ // items must be array
      items = req.body.items;
      let promises = items.map(item => {
        return ItemInventory.update(item.values, {where: {id: item.id}})
      });
      let promiseResults = await Promise.all(promises).catch(err => {
        logger.error(err);
      });
      updatedItems = promiseResults.reduce((arr, current, currentIndex) => {
        if (Array.isArray(current)){
          return current[0]==1?[...arr, items[currentIndex]]:arr; 
        } else {
          return arr;
        }
      }, []);
      eventEmitter.emit('bulk.put',updatedItems);
      res.status(200).json({updatedItems: updatedItems});
    }
  } catch (error) {
    logger.error(error)
  }
});
router.post('/api/bulk/items', async (req, res)=>{
  try {
    let items = [];
    if ("items" in req.body){
      items = req.body.items;
      let response = await ItemInventory.bulkCreate(items);
      res.status(200).json({createdItems: response.map(_=>_.dataValues)})
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.delete('/api/bulk/items', async (req, res)=>{
  try{
    let item_ids=[];
    if ("item_ids" in req.body){
      item_ids = req.body.item_ids;
      let response = await ItemInventory.destroy({where: {id: {[Op.in]: item_ids}}});
      res.status(200).json({deleted_count: response})
    }
  } catch (error){
    return res.status(500).json({error: error.message});
  }
});
router.put('/api/items/:item_id(\\d+)', async (req, res)=>{
  let fields_to_update = req.body;
  let foundOne = await ItemInventory.findByPk(req.params.item_id);
  try {
    let result = await foundOne.update(fields_to_update);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/api/items/:item_id(\\d+)', async (req, res)=>{
  try{
    let foundItem = await ItemInventory.findByPk(req.params.item_id);
    if(foundItem) {
      let result = await foundItem.destroy();
      res.send({message: result});
    }
    else {
      res.status(404).send({message: `item with ID:${item_id} not found`});
    }
  } catch(error){
    res.status(500).send(error);
  }

});

router.get('/api/items/search', async (req, res) => {
  let partialName = req.query["itemname"];
  try {
    let name_to_search = partialName.replace(" ", "%");
    let result = await ItemInventory.findByName(name_to_search);
    let unique=[];
    let flag={};
    result.forEach(item=>{
      if(!flag[item.itemname]){
        flag[item.itemname]=true;
        unique.push(item);
      }
    });
    res.status(200).send(unique);
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error);
  }
  //res.status(200).send('Hello World from the server!');
});

module.exports = router;
