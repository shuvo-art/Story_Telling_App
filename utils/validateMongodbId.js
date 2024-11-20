const mongoose = require('mongoose');

const validateMongodbId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

module.exports = validateMongodbId;
