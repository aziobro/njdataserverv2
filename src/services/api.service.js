const httpStatus = require('http-status');
const { PromiseProvider } = require('mongoose');
const { SchoolDetails } = require('../models');
const ApiError = require('../utils/ApiError');


const listCounties = async (filter) =>{
    console.log(filter);
    const pipeline = ([
        {'$match':filter},
        {'$match':{"CountyName":{"$ne":null}}},
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
    console.log(JSON.stringify(pipeline));    
    const testdata = await SchoolDetails.aggregate(pipeline);
    return testdata;           

}

const listSchools = async (filter) =>{
    console.log(filter);
    const pipeline = ([
        {'$match':filter},
        {'$project':{
                'id':"$_id", 
                'CDS':1,
                'CountyName':1,
                'DistrictName':1,
                'SchoolName':1,
                'Grades':1,
                'DFG2000':1
                }  
        }
        ])
    console.log(JSON.stringify(pipeline));    
    const schooldata = await SchoolDetails.aggregate(pipeline);
    return schooldata;           

};

const listScores = async(filter)=>{
    const pipeline = ([
        {"$match":filter},
        {"$match": {'scores.k' : {"$in" : ["ACT.English", "ACT.Math",
        "ACT.Reading", "ACT.Science",
        "PSAT", "PSAT.Math",
        "PSAT.Reading and Writing", "SAT.Math",
        "SAT.Reading and Writing"]}
        }},
        {'$project': {
        '_id':0,
        'CDS':1,
        'CountyName':1,
        'DistrictSchoolNameShort':1,
        'DistrictName':1,
        'SchoolName':1,
        'scores': 1
        }  
        }
        ,
        {'$unwind' : "$scores"},
        {'$project': {
        'x': '$CDS',
        'text': {"$concat":['$DistrictName',' / ','$SchoolName']},
        'y' : "$scores.v",
        'score-year' : {"$concat":["$scores.k"," / ","$scores.y"]}
        }},
        {"$group":{
        "_id":"$score-year",
        "x":{"$push":"$x"},
        "y":{"$push":"$y"},
        "text":{"$push":"$text"}
        }}
    ])
    console.log(pipeline);
    const schooldata = await SchoolDetails.aggregate(pipeline);
    return schooldata;

}



module.exports ={
    listCounties,
    listSchools,
    listScores,
};