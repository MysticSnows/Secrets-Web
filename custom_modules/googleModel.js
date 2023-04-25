const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
const googleSchema = new mongoose.Schema({
    googleId: String,
    secret: String
});

googleSchema.plugin(findOrCreate);

module.exports = mongoose.model("GoogleUser", googleSchema);