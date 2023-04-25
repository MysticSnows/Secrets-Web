const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    secret: String
});

module.exports = mongoose.model("User", userSchema);