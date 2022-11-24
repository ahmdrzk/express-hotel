exports.isArrayWithDuplicates = function (arr) {
  /*
  `arr`: <Array>
  */

  return new Set(arr).size === arr.length;
};

exports.isIdInRange = function (id, min, max) {
  /*
  `id`: <String> || <Number>
  `min`: <Number>
  `max`: <Number>
  */

  return id >= min && id <= max;
};

exports.isExistInCollection = async function (id, model) {
  /*
  `id`: <String>
  `model`: <Object> Mongoose Model Class
  */

  return await model.findOne({ _id: id }, "_id");
};

exports.isIdStartsWithVal = function (value) {
  /*
  `value`: <Number> || <String>
  */

  return this._id.startsWith(value);
};
