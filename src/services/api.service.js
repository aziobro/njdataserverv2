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

const listNjslaScoresAll = async (filter, filter2, filter3) => {
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
                { L45: { $round: [{ $sum: ['$$scores.sd.L4Percent', '$$scores.sd.L5Percent'] }, 1] } },
                {
                  L345: {
                    $round: [{ $sum: ['$$scores.sd.L3Percent', '$$scores.sd.L4Percent', '$$scores.sd.L5Percent'] }, 1],
                  },
                },
                {
                  L2345: {
                    $round: [
                      {
                        $sum: [
                          '$$scores.sd.L2Percent',
                          '$$scores.sd.L3Percent',
                          '$$scores.sd.L4Percent',
                          '$$scores.sd.L5Percent',
                        ],
                      },
                      1,
                    ],
                  },
                },
                {
                  L12345: {
                    $round: [
                      {
                        $sum: [
                          '$$scores.sd.L1Percent',
                          '$$scores.sd.L2Percent',
                          '$$scores.sd.L3Percent',
                          '$$scores.sd.L4Percent',
                          '$$scores.sd.L5Percent',
                        ],
                      },
                      1,
                    ],
                  },
                },
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
    // { $sort: { L4L5Sum: 1 } },
    { $unwind: '$scores' },
    {
      $project: {
        CDS: '$CDS',
        'cds-year': { $concat: ['$CDS', '$scores.y'] }, //'.', '$scores.k', '.',
        'test-year': { $concat: ['$scores.k', ' - ', '$scores.y'] },
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
        year: '$scores.y',
        test: '$scores.k',
        L5: '$scores.sd.L5Percent',
        L45: '$scores.L45',
        L345: '$scores.L345',
        L2345: '$scores.L2345',
        L12345: '$scores.L12345',
        scoreText: 1,
        scoreText12: 1,
        DistrictName: 1,
        SchoolName: 1,
      },
    },
    // { $sort: { test: 1, year: 1 } },
    {
      $group: {
        _id: '$test-year',
        CDS: { $push: '$CDS' },
        'cds-year': { $push: '$cds-year' },
        L4L5: { $push: '$L4L5' },
        L1L2: { $push: '$L1L2' },
        text: { $push: '$text' },
        avgL4L5: { $push: '$avgL4L5' },
        avgL1L2: { $push: '$avgL1L2' },
        test: { $push: '$test' },
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
        L5: { $push: '$L5' },
        L45: { $push: '$L45' },
        L345: { $push: '$L345' },
        L2345: { $push: '$L2345' },
        L12345: { $push: '$L12345' },
        year: { $push: '$year' },
        testName: { $push: '$test' },
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

module.exports = {
  listCounties,
  listSchools,
  listScores,
  listNjslaScores,
  listNjslaScoresAll,
};
