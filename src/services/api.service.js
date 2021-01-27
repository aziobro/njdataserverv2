const httpStatus = require('http-status');
const { PromiseProvider } = require('mongoose');
const { SchoolDetails } = require('../models');
const ApiError = require('../utils/ApiError');


const listCounties = async (req,res) =>{
    const pipeline = ([
        {'$project':{ 
                'CountyCode':1,
                'CountyName':1
                }  
        }
        ,
        {'$match':{'CountyName':{'$not':/PRIV.*/}}},
        {'$group' : {
            "_id": {"value":"$CountyCode","label":"$CountyName"}
        }},
        {
            '$sort' : {"_id.label": 1}
        },
        {"$project":{ "_id":0,
            "value" : "$_id.value",
            "label" : "$_id.label"
        }}])
    const testdata = await SchoolDetails.aggregate(pipeline);
    return testdata;           

}


module.exports ={
    listCounties,
};