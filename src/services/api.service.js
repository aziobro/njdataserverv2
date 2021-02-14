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
            $filter : {
                input : "$scores",
                as: "score",
                cond: { $in: ['$$score.k', filter2.scores] },
               }
        } ,
      },
    },
    { $addFields: {avgScore: {$avg : "$scores.v"}}},
    { $match: {scores:{$ne:null}}},
    { $set: 
        {scores :{
            $function: {
                body:" function(scores){scores.sort((a,b) => a.y > b.y);return scores;}",
                args: ["$scores"],
                lang : "js"
            }
        }}
    },
    { $addFields: {scoreText : {
        $reduce : {
            input: "$scores",
            initialValue : "",
            in: {$concat:["$$value","$$this.y",": ",
            {$toString:"$$this.v"},"<br>"] }
        }
    }}},
    { $match: {avgScore:{$ne:null}}},
    { $sort: {avgScore:1}},
    { $unwind: '$scores' },
    { $project: {
        x: '$CDS',
        text: { $concat: ['$DistrictName', ' / ', '$SchoolName'] },
        y: '$scores.v',
        'score-year': { $concat: ['$scores.k', ' / ', '$scores.y'] },
        avgScore:1,
        scoreText:1,
        DistrictName:1,
        SchoolName:1,
      },
    },



    {
      $group: {
        _id: '$score-year',
        x: { $push: '$x' },
        y: { $push: '$y' },
        text: { $push: '$text' },
        avgScore : {$push: '$avgScore'},
        scoreText : {$push: {$concat:["<b>","$DistrictName","<br>","$SchoolName","<br><br>Year: Mean Score</b><br>",'$scoreText']}},
        DistrictName : {$push : '$DistrictName'},
        SchoolName : {$push: '$SchoolName'}


      },
    },
    {
      $sort: { '_id': 1 },
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

module.exports = {
  listCounties,
  listSchools,
  listScores,
};
