// 07/08/2020 - 10:30
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({

    hotelId: mongoose.SchemaTypes.ObjectId,

    profileURL: String,

    name: String,

    price: Number,

    tag: Array,

    Type: String,

    Total_orders: Number

});

const FoodItem = mongoose.model("FoodItem", foodSchema);

module.exports = FoodItem;