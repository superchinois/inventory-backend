const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
let Papa = require('papaparse');
let fs = require('fs');
const Op = Sequelize.Op
const R = require("ramda");

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/usr/db/inventory-test.db',
    logging: false,
});

const loadCsv = (filePath, encoding='utf8', notNullField=0, separator=";") => {
    return new Promise(function (resolve, reject) {
        try {
            const data = fs.readFileSync(filePath, encoding);
            // Parse local CSV file
            Papa.parse(data, {
                header: true,
                delimiter:separator,
                error: (err, parsedFile) => reject(err, parsedFile),
                complete: function (results) {
                    let firstField=results.meta.fields[notNullField];
                    let meta = results.meta;
                    let data = results.data.filter(e=>e[firstField]&&e[firstField].length>0?true:false);
                    resolve({meta: meta, data:data});
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

const updateUpdatedAt = (sequelize)=>(override_params) => {
    sequelize.query("update items set updatedAt=:date where id=:id"
                    , {replacements:override_params,type:QueryTypes.UPDATE});
};

const test_override_updatedAt = (csvFile) => {
    return loadCsv(csvFile).then(R.compose(R.map(R.props(["id","updatedAt"])), R.prop("data"))) // extract id and updatedAt
    .then(data =>R.zip(...R.map(R.applyTo(data))([R.map(R.nth(0)), R.map(R.compose(R.replace("Z",""),R.replace("T"," "),R.nth(1)))])))
    .then(R.map(R.zipObj(["id", "date"])))
    //.then(R.forEach(updateUpdatedAt(sequelize)))
};