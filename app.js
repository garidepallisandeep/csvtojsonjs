// require csvtojson module
const CSVToJSON = require('csvtojson');

var fs = require('fs');

const Banner_Mobile_Big = { w: 300, h: 250 }
const Banner_Mobile_Bottom = { w: 320, h: 50 }

const character = '/'
const slashReplacer = new RegExp(character, 'g')

function isStringEmpty(value) {
    return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}

CSVToJSON().fromFile('nypost.csv')
    .then(configs => {
        // console.log(configs);

        let dateString = new Date().toISOString().slice(0, 10);
        let dirPath = "./result_files/" + dateString;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        var supportedUnits = []

        for (configJsonObject of configs) {
            /*  Mappings:
                    'unitId' -> replaced / with - and stored as 'id' on top level
                    'Size Labels' -> if 'Mobile_Big' then add coressponding object to array and store under 'format'. Store 'format' dictionary under 'banner'. Add 'ext' dictionary to top level.
                    'appnexus_placementId' -> store under 'placementId' in 'appnexus' dictionary. Then store 'appnexus' under 'ext' dictionary. Add 'ext' dictionary to top level.
            */
            // console.log(configJsonObject);
            var topDictionary = {};
            var unitId = configJsonObject["unitId"];
            if (isStringEmpty(unitId)) {
                console.log("Error : UnitId not found");
            } else {
                console.log("Unit Id : ", unitId);
                supportedUnits.push(unitId)

                var configId = unitId.replace('/', ''); // Replace first slash with blank
                configId = configId.replace(slashReplacer, '-'); // Replace rest of the slashes with hyphen
                topDictionary['id'] = configId;
                console.log("Config Id : ", configId);

                // Banner, Video, Native search
                if (configJsonObject['Banner Ad'] == 'yes') {
                    console.log("Banner Ad found");
                    var bannerAdsArray = []

                    // Size search
                    let size = configJsonObject['Size Labels'];
                    switch (size) {
                        case 'Mobile_Big':
                            bannerAdsArray.push(JSON.parse(JSON.stringify(Banner_Mobile_Big)))
                            break;
                        case 'Mobile_Bottom':
                            bannerAdsArray.push(JSON.parse(JSON.stringify(Banner_Mobile_Bottom)))
                            break;
                        default:
                            console.log("Error : Banner size not found");
                    }

                    var bannerDictionary = {}
                    bannerDictionary['format'] = bannerAdsArray
                    topDictionary['banner'] = bannerDictionary
                } else if (!isStringEmpty(configJsonObject['Video Ad'])) {
                    console.log("Video Ad found");
                } else if (!isStringEmpty(configJsonObject['Native Ad'])) {
                    console.log("Native Ad found");
                } else {
                    console.log("Error : Ad type not found");
                }

                var extDictionary = {}

                // NewsConnect search
                let ncPlacementId = configJsonObject['NewsConnect placementId'];
                if (!isStringEmpty(ncPlacementId)) {
                    extDictionary['newsconnect'] = { placementId: parseInt(ncPlacementId, 10) };
                } else {
                    console.log("Error : NewsConnect placement not found");
                }

                // AppNexus search
                let appnexusPlacementId = configJsonObject['AppNexus placementId'];
                if (!isStringEmpty(appnexusPlacementId)) {
                    extDictionary['appnexus'] = { placementId: parseInt(appnexusPlacementId, 10) };
                } else {
                    console.log("Error : AppNexus placement not found");
                }

                // Rubicon search
                let rubiconAccountId = configJsonObject['Rubicon accountId'];
                let rubiconSiteId = configJsonObject['Rubicon siteId'];
                let rubiconZoneId = configJsonObject['Rubicon zoneId'];
                if (!isStringEmpty(rubiconAccountId) &&
                    !isStringEmpty(rubiconSiteId) &&
                    !isStringEmpty(rubiconZoneId)) {
                    extDictionary['rubicon'] = {
                        accountId: parseInt(rubiconAccountId, 10),
                        siteId: parseInt(rubiconSiteId, 10),
                        zoneId: parseInt(rubiconZoneId, 10)
                    };
                } else {
                    console.log("Error : Rubicon IDs not found");
                }

                topDictionary['ext'] = extDictionary;

                let finalJSON = JSON.stringify(topDictionary);
                console.log(finalJSON);

                let filename = dirPath + "/" + configId + ".json";
                fs.writeFile(filename, finalJSON, 'utf8', function (err) {
                    if (err) {
                        console.log("Error : Unable to write JSON Object to File");
                        return console.log(err);
                    }
                    console.log(filename + " saved");
                });
            }
        }

        let supportedAdTypesFilename = dirPath + "/SupportedAdUnits.json";
        fs.writeFile(supportedAdTypesFilename, JSON.stringify(supportedUnits), 'utf8', function (err) {
            if (err) {
                console.log("Error : Unable to write JSON Object to File");
                return console.log(err);
            }
            console.log(supportedAdTypesFilename + " saved");
        });
    }).catch(err => {
        console.log("Error : " + err);
    });

