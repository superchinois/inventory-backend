const express = require('express');
const router = express.Router();
const {models} = require('../models/index');
const CONFIG = require("../config/config")();

const ItemInventory = models.InventoryItem;

router.get('/api/buildings', async (req, res)=>{
  res.send(CONFIG.buildings);
});

router.get('/api/alleys', async (req, res)=>{
  res.send(CONFIG.alleys);
});
router.get('/api/alleys_levels', async (req, res)=>{
  res.send(CONFIG.alleys_levels);
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
  let filters = ["building","location","detail_location", "itemcode"]
  whereClause=filters.reduce((acc, f)=>{
    let query_value = req.query[f];
    if(query_value){
      return [...acc, {[f]:query_value}]
    }
    else return acc;
  },[])
  //console.log(whereClause);
  let filtered = await ItemInventory.findAllItems(whereClause);
  res.send(filtered);
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

router.get('/api/items/locations', (req, res) => {
  res.status(200).send('Hello World from the server!');
});

module.exports = router;
