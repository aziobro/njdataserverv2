/**
 * Create an object composed of the picked object properties
 * @param {Object} object
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
//      console.log("---");
//      console.log(object[key]);
      try{obj[key] = JSON.parse(object[key]); } catch(e) { obj[key] = object[key]; }
      
    }
    return obj;
  }, {});
};

module.exports = pick;
