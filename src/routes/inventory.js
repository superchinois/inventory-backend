const express = require('express');
const router = express.Router();
const {models} = require('../models/index');
const CONFIG = require("../config/config")();
const lodash = require("lodash");

const ItemInventory = models.InventoryItem;

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
  console.log(req.query["itemname"])
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

router.get('/api/items/test', async (req, res) => {
  let partialName = req.query["itemname"];
  try {
    let result = await ItemInventory.findByName(partialName);
    res.status(200).send(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error);
  }
  //res.status(200).send('Hello World from the server!');
});

module.exports = router;
