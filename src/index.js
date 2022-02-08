//import 'dotenv/config';
const CONFIG = require("./config/config")();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');

const {models, sequelize, DataTypes} = require('./models/index');
const routes = require('./routes/index');

const helpers = require('./utils/helpers')

const corsOption = {
    origin: '*'
    ,optionsSuccessStatus:200
};

const app = express();
app.use(morgan('combined'));
app.use(cors(corsOption));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('public'));
app.use('/', routes.inventory);

const port = process.env.PORT || 3000;
// Start
const inventoryItem = models.InventoryItem;
const eraseDatabaseOnSync = CONFIG.eraseDatabaseOnSync;
sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
    if (eraseDatabaseOnSync) {
      console.log("seed database ...");
      let initialData_path = CONFIG.initial_data_path;
      createTable(sequelize, inventoryItem, initialData_path);
    }
  
    app.listen(port, function () {
        console.log('App listening on port: ' + port);
    });
  });

function createTable(sequelize, itemModel, filename) {
  sequelize.sync({ force: true })
    .then(() => {
      console.log(`Database & tables created!`);
      helpers.loadCsv(filename)
      .then(results => {
          let firstField=results.meta.fields[0];
          let rows = results.data.filter(e=>e[firstField].length>0?true:false);
          itemModel.bulkCreate(rows).then(function() {
              return itemModel.findAll();
            });
      })
      .catch(err=>{console.error(err)})
    });
}



