// 07/08/2020 - 10:30
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: String,

    email: String,

    phone: String,

    password: String,

    active: {

        type: Boolean,

        default: false

    },

    activeToken: String,

    activeExpires: String,

    forgotToken: String,

    forgotExpires: String,

    googleId: String,

    facebookId: String,

    createdAt: String,

    profileURL: String,

    purchaseList: Array

});

const User = mongoose.model("User", userSchema);

module.exports = User;