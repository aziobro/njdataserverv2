const httpStatus = require('http-status');
const { PromiseProvider } = require('mongoose');
const { SchoolDetails } = require('../models');
const ApiError = require('../utils/ApiError');

const listCounties = async (filter) => {
  console.log(filter);
  const pipeline = [
    { $match: filter },
    { $match: { CountyName: { $ne: null } } },
    {
      $project: {
        CountyCode: 1,
        CountyName: 1,
      },
    },
    { $match: { CountyName: { $not: /PRIV.*/ } } },
    {
      $group: {
        _id: { value: '$CountyCode', label: '$CountyName' },
      },
    },
    {
      $sort: { '_id.label': 1 },
    },
    { $project: { _id: 0, value: '$_id.value', label: '$_id.label' } },
  ];
  console.log(JSON.stringify(pipeline));
  const testdata = await SchoolDetails.aggregate(pipeline);
  return testdata;
};

const listSchools = async (filter) => {
  console.log(filter);
  const pipeline = [
    { $match: filter },
    {
      $project: {
        id: '$CDS',
        CDS: 1,
        CountyName: 1,
        DistrictName: 1,
        SchoolName: 1,
        Grades: 1,
        DFG2000: 1,
      },
    },
  ];
  console.log(JSON.stringify(pipeline));
  const schooldata = await SchoolDetails.aggregate(pipeline);
  return schooldata;
};

const listScores = async (filter, filter2) => {
  const pipeline = [
    { $match: filter },
    {
      $project: {
        _id: 0,
        CDS: 1,
        CountyName: 1,
        DistrictSchoolNameShort: 1,
        DistrictName: 1,
        SchoolName: 1,
        scores: {
          $filter: {
            input: '$scores',
            as: 'score',
            cond: { $in: ['$$score.k', filter2.scores] },
          },
        },
      },
    },
    { $addFields: { avgScore: { $avg: '$scores.v' } } },
    { $match: { scores: { $ne: null } } },
    {
      $set: {
        scores: {
          $function: {
            body: ' function(scores){scores.sort((a,b) => a.y > b.y);return scores;}',
            args: ['$scores'],
            lang: 'js',
          },
        },
      },
    },
    {
      $addFields: {
        scoreText: {
          $reduce: {
            input: '$scores',
            initialValue: '',
            in: { $concat: ['$$value', '<br>', '$$this.y', ' ', { $toString: '$$this.v' }] },
          },
        },
      },
    },
    {
      $addFields: {
        scoreText: {
          $reduce: {
            input: '$scores',
            initialValue: '',
            in: { $concat: ['$$value', '$$this.y', ': ', { $toString: '$$this.v' }, '<br>'] },
          },
        },
      },
    },
    { $match: { avgScore: { $ne: null } } },
    { $sort: { avgScore: 1 } },
    { $unwind: '$scores' },
    {
      $project: {
        x: '$CDS',
        text: { $concat: ['$DistrictName', ' / ', '$SchoolName'] },
        y: '$scores.v',
        'score-year': '$scores.y',
        avgScore: 1,
        scoreText: 1,
        DistrictName: 1,
        SchoolName: 1,
      },
    },

    {
      $group: {
        _id: '$score-year',
        x: { $push: '$x' },
        y: { $push: '$y' },
        text: { $push: '$text' },
        avgScore: { $push: '$avgScore' },
        scoreText: {
          $push: {
            $concat: ['<b>', '$DistrictName', '<br>', '$SchoolName', '<br><br>Year: Mean Score</b><br>', '$scoreText'],
          },
        },
        DistrictName: { $push: '$DistrictName' },
        SchoolName: { $push: '$SchoolName' },
      },
    },
    {
      $sort: { _id: 1 },
    },

    // { $match: filter },
    // {
    //   $project: {
    //     _id: 0,
    //     CDS: 1,
    //     CountyName: 1,
    //     DistrictSchoolNameShort: 1,
    //     DistrictName: 1,
    //     SchoolName: 1,
    //     scores: {
    //       $filter: {
    //         input: '$scores',
    //         as: 'score',
    //         cond: { $in: ['$$score.k', filter2.scores] },
    //       },
    //     },
    //   },
    // },
    // { $addFields: { avgScore: { $avg: '$scores.v' } } },
    // { $match: { avgScore: { $ne: null } } },
    // { $sort: { avgScore: 1 } },
    // { $unwind: '$scores' },
    // {
    //   $project: {
    //     x: '$CDS',
    //     text: { $concat: ['$DistrictName', ' / ', '$SchoolName'] },
    //     y: '$scores.v',
    //     // 'score-year': { $concat: ['$scores.k', ' / ', '$scores.y'] },
    //     year: '$scores.y',
    //     avgScore: 1,
    //     DistrictName: 1,
    //     SchoolName: 1,
    //   },
    // },
    // {
    //   $group: {
    //     _id: '$year',
    //     x: { $push: '$x' },
    //     y: { $push: '$y' },
    //     text: { $push: '$text' },
    //     avgScore: { $push: '$avgScore' },
    //     DistrictName: { $push: '$DistrictName' },
    //     SchoolName: { $push: '$SchoolName' },
    //   },
    // },
    // {
    //   $sort: { _id: 1 },
    // },

    // {
    //   $project: {
    //     _id: 0,
    //     CDS: 1,
    //     CountyName: 1,
    //     DistrictSchoolNameShort: 1,
    //     DistrictName: 1,
    //     SchoolName: 1,
    //     scores: 1,
    //   },
    // },
    // { $unwind: '$scores' },
    // {
    //   $match: {
    //     'scores.k': { $in: filter2.scores },
    //   },
    // },

    // ***************GOT CLOSE WITH THIS SOLUTION COMMENTED OUT FOR THE AVERAGE - PROBLEM WAS THERE WERE MULTI SCORES FOR ONE YEAR.  HAS TO DO WITH THE UNWIND STATEMENTS
    // {
    //   $group: {
    //     _id: '$CDS',
    //     avgScore: { $avg: '$scores.v' },
    //     'score-year': { $push: { $concat: ['$scores.k', ' / ', '$scores.y'] } },
    //     x: { $first: '$CDS' },
    //     y: { $push: '$scores.v' },
    //     text: { $first: { $concat: ['$DistrictName', ' / ', '$SchoolName'] } },
    //   },
    // },

    // {
    //   $unwind: '$score-year',
    // },
    // {
    //   $unwind: '$y',
    // },
    // {
    //   $project: {
    //     avgScore: 1,
    //     x: 1,
    //     y: 1,
    //     text: 1,
    //     'score-year': 1,
    //   },
    // },

    // {
    //   $project: {
    //     x: '$CDS',
    //     text: { $concat: ['$DistrictName', ' / ', '$SchoolName'] },
    //     y: '$scores.v',
    //     'score-year': { $concat: ['$scores.k', ' / ', '$scores.y'] },
    //     avgScore: '$avgScore',
    //   },
    // },
    // // {
    // //   $sort: { y: 1, 'score-year': 1 },
    // // },
    // {
    //   $group: {
    //     _id: '$score-year',
    //     x: { $push: '$x' },
    //     y: { $push: '$y' },
    //     text: { $push: '$text' },
    //     //avgScore: { $addToSet: { $avg: '$y' } },
    //   },
    // },
  ];
  console.log(JSON.stringify(pipeline));
  const schoolscores = await SchoolDetails.aggregate(pipeline);
  return schoolscores;
};

const listNjslaScores = async (filter, filter2, filter3) => {
  const pipeline = [
    { $match: filter },
    {
      $project: {
        _id: 0,
        CDS: 1,
        CountyName: 1,
        DistrictSchoolNameShort: 1,
        DistrictName: 1,
        SchoolName: 1,
        scores: {
          $filter: {
            input: '$scores',
            as: 'score', //{ $regexMatch: { input: '$$score.k', regex: filter2.scores } },
            cond: {
              $and: [
                { $regexMatch: { input: '$$score.k', regex: filter2.scores } },
                { $regexMatch: { input: '$$score.k', regex: filter3.subgroups } },
              ],
            },
          },
        },
      },
    },
    { $match: { scores: { $gt: [] } } },
    {
      $set: {
        scores: {
          $map: {
            input: '$scores',
            as: 'scores',
            in: {
              $mergeObjects: [
                '$$scores',
                { L4L5Sum: { $round: [{ $sum: ['$$scores.sd.L4Percent', '$$scores.sd.L5Percent'] }, 1] } },
                { L1L2Sum: { $round: [{ $sum: ['$$scores.sd.L1Percent', '$$scores.sd.L2Percent'] }, 1] } },
              ],
            },
          },
        },
      },
    },
    { $addFields: { avgL4L5Sum: { $round: [{ $avg: '$scores.L4L5Sum' }, 1] } } },
    { $addFields: { avgL1L2Sum: { $round: [{ $avg: '$scores.L1L2Sum' }, 1] } } },
    {
      $set: {
        scores: {
          $function: {
            body: ' function(scores){scores.sort((a,b) => a.y > b.y);return scores;}',
            args: ['$scores'],
            lang: 'js',
          },
        },
      },
    },
    {
      $addFields: {
        scoreText: {
          $reduce: {
            input: '$scores',
            initialValue: '',
            in: { $concat: ['$$value', '$$this.y', ': ', { $toString: '$$this.L4L5Sum' }, '<br>'] },
          },
        },
      },
    },
    {
      $addFields: {
        scoreText12: {
          $reduce: {
            input: '$scores',
            initialValue: '',
            in: { $concat: ['$$value', '$$this.y', ': ', { $toString: '$$this.L1L2Sum' }, '<br>'] },
          },
        },
      },
    },
    { $sort: { avgL4L5Sum: 1 } },
    { $unwind: '$scores' },
    {
      $project: {
        x: '$CDS',
        L4L5: '$scores.L4L5Sum',
        L1L2: '$scores.L1L2Sum',
        text: { $concat: ['$DistrictName', ' / ', '$SchoolName'] },
        'score-year': '$scores.y',
        avgL4L5: '$avgL4L5Sum',
        avgL1L2: '$avgL1L2Sum',
        Level1: '$scores.sd.L1Percent',
        Level2: '$scores.sd.L2Percent',
        Level3: '$scores.sd.L3Percent',
        Level4: '$scores.sd.L4Percent',
        Level5: '$scores.sd.L5Percent',
        test: '$scores.k',
        year: '$scores.y',
        scoreText: 1,
        scoreText12: 1,
        DistrictName: 1,
        SchoolName: 1,
      },
    },
    {
      $group: {
        _id: '$score-year', //, test: '$test'
        x: { $push: '$x' },
        test: { $push: '$test' },
        L4L5: { $push: '$L4L5' },
        L1L2: { $push: '$L1L2' },
        text: { $push: '$text' },
        avgL4L5: { $push: '$avgL4L5' },
        avgL1L2: { $push: '$avgL1L2' },
        scoreText: {
          $push: {
            $concat: ['<b>', '$DistrictName', '<br>', '$SchoolName', '<br><br>Year: Mean Score</b><br>', '$scoreText'],
          },
        },
        scoreText12: {
          $push: {
            $concat: ['<b>', '$DistrictName', '<br>', '$SchoolName', '<br><br>Year: Mean Score</b><br>', '$scoreText12'],
          },
        },
        Level1: { $push: '$Level1' },
        Level2: { $push: '$Level2' },
        Level3: { $push: '$Level3' },
        Level4: { $push: '$Level4' },
        Level5: { $push: '$Level5' },
        year: { $push: '$year' },
        DistrictName: { $push: '$DistrictName' },
        SchoolName: { $push: '$SchoolName' },
      },
    },
    { $sort: { _id: 1 } },
  ];
  console.log(JSON.stringify(pipeline));
  const schoolscores = await SchoolDetails.aggregate(pipeline);
  return schoolscores;
};

const listNjslaScoresAll = async (filter, filter2, filter3, filterYears) => {
  const pipeline = [
    { $match: filter },
    {
      $project: {
        _id: 0,
        CDS: 1,
        CountyName: 1,
        DistrictSchoolNameShort: 1,
        DistrictName: 1,
        SchoolName: 1,
        scores: {
            $filter : {
                input : "$scores",
                as: "score",
                cond: {
                  $and: [
                    { $regexMatch: { input: '$$score.k', regex: filter2.scores } },
                    { $regexMatch: { input: '$$score.k', regex: filter3.subgroups } },
                    { $regexMatch: { input: '$$score.y', regex: filterYears.years } },
                  ],
                }
              } ,
        },
        },
    },
    {$unwind: "$scores"},
    {$match: {
      "scores.sd.L1Percent": {$ne:"*"}
    }},
    {$unwind: "$scores"},
    {$match: {
      "scores.sd.L1Percent": {$ne:"*"}
    }},
    {$project: {
      SchoolName: 1,
     "CDS": "$CDS", "year":"$scores.y",
     "scoresk":"$scores.k", 
      mean:"$scores.v",
      L1: "$scores.sd.L1Percent",
      L2: "$scores.sd.L2Percent",
      L12 : {$add:["$scores.sd.L1Percent", "$scores.sd.L2Percent"]},
      L3: "$scores.sd.L3Percent",
      L123: {$add:["$scores.sd.L1Percent", "$scores.sd.L2Percent","$scores.sd.L3Percent"]},
      L4: "$scores.sd.L4Percent",
      L1234: {$add:["$scores.sd.L1Percent", "$scores.sd.L2Percent","$scores.sd.L3Percent","$scores.sd.L4Percent"]},
      L5: "$scores.sd.L5Percent",
      L12345 : {$add:["$scores.sd.L1Percent", "$scores.sd.L2Percent","$scores.sd.L3Percent","$scores.sd.L4Percent","$scores.sd.L5Percent"]},
      L45 : {$add:["$scores.sd.L4Percent","$scores.sd.L5Percent"]},
      L345 : {$add:["$scores.sd.L3Percent","$scores.sd.L4Percent","$scores.sd.L5Percent"]},
      L2345 : {$add:["$scores.sd.L2Percent","$scores.sd.L3Percent","$scores.sd.L4Percent","$scores.sd.L5Percent"]},

   }},
   {$facet :{
     "sortingbyScores":[
       {$group:{
         _id: "$SchoolName", 
         L1avg : {$avg: "$L1"},
         L2avg : {$avg: "$L2"},
         L3avg : {$avg: "$L3"},
         L4avg : {$avg: "$L4"},
         L5avg : {$avg: "$L5"},
         L12avg : {$avg: "$L12"},
         L123avg : {$avg: "$L123"},
         L1234avg : {$avg: "$L1234"},
         L12345avg : {$avg: "$L12345"},
         L2345avg : {$avg: "$L2345"},
         L345avg : {$avg: "$L345"},
         L45avg : {$avg: "$L45"},
       }},
       {$sort:{L45avg:1}},
       {$group:{
         _id: null,
         "SchoolName": {$push:"$_id"},
         "CDS":{$push:"$CDS"},
         L1avg : {$push: "$L1avg"},
         L2avg : {$push: "$L2avg"},
         L3avg : {$push: "$L3avg"},
         L4avg : {$push: "$L4avg"},
         L5avg : {$push: "$L5avg"},
         L12avg : {$push: "$L12avg"},
         L123avg : {$push: "$L123avg"},
         L1234avg : {$push: "$L1234avg"},
         L12345avg : {$push: "$L12345avg"},
         L2345avg : {$push: "$L2345avg"},
         L345avg : {$push: "$L345avg"},
         L45avg : {$push: "$L45avg"},
       }}
     ],
     "data":[
       {$sort: {L45:1}},
       {$group: {
         _id: {$concat:["$scoresk","-","$year"]},
         "SchoolName": {$push:"$SchoolName"},
         "CDS" : {$push: "$CDS"},
         year : {$push : "$year"}, 
         mean : {$push: "$mean"},
         L1 : {$push: "$L1"},
         L2 : {$push: "$L2"},
         L3 : {$push: "$L3"},
         L4 : {$push: "$L4"},
         L5 : {$push: "$L5"},
         L12 : {$push: "$L12"},
         L123 : {$push: "$L123"},
         L1234 : {$push: "$L1234"},
         L12345 : {$push: "$L12345"},
         L2345 : {$push: "$L2345"},
         L345 : {$push: "$L345"},
         L45 : {$push: "$L45"},
       }},
       {$sort: {"_id":1}}   
   ],
     "datagrouped":[
       {$sort: {L45:1}},
       {$group: {
         _id: {"SchoolName": "$SchoolName",
               "CDS" : "$CDS",
               "scoresk" :"$scoresk"},
         year : {$push : "$year"}, 
         mean : {$avg: "$mean"},
         L1 : {$avg: "$L1"},
         L2 : {$avg: "$L2"},
         L3 : {$avg: "$L3"},
         L4 : {$avg: "$L4"},
         L5 : {$avg: "$L5"},
         L12 : {$avg: "$L12"},
         L123 : {$avg: "$L123"},
         L1234 : {$avg: "$L1234"},
         L12345 : {$avg: "$L12345"},
         L2345 : {$avg: "$L2345"},
         L345 : {$avg: "$L345"},
         L45 : {$avg: "$L45"},
       }},
       {$sort: {L45:1}},
       {$group:{
         _id: {Group:"$_id.scoresk"},
         "SchoolName": {$push:"$_id.SchoolName"},
         "CDS" : {$push: "$_id.CDS"},
         year : {$push : "$year"}, 
         mean : {$push: "$mean"},
         L1 : {$push: "$L1"},
         L2 : {$push: "$L2"},
         L3 : {$push: "$L3"},
         L4 : {$push: "$L4"},
         L5 : {$push: "$L5"},
         L12 : {$push: "$L12"},
         L123 : {$push: "$L123"},
         L1234 : {$push: "$L1234"},
         L12345 : {$push: "$L12345"},
         L2345 : {$push: "$L2345"},
         L345 : {$push: "$L345"},
         L45 : {$push: "$L45"},
         
        }},
       {$sort: {"_id":1}}   
   ],




   } },

];
  console.log(JSON.stringify(pipeline));
  const schoolscores = await SchoolDetails.aggregate(pipeline);
  return schoolscores;
};

module.exports = {
  listCounties,
  listSchools,
  listScores,
  listNjslaScores,
  listNjslaScoresAll,
};
