var Papa = require("papaparse");
var fs = require('fs');

function loadCsv(filePath, encoding='utf8', notNullField=0, separator=";") {
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
}

module.exports = {loadCsv};