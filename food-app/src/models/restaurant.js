// 07/08/2020 - 10:30
const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: String,
    description: String,
    phone: String,
    address: String,
    profileURL: String,
    timing: String,
    menuCardPhoto: String,
    status: String,
    menu: Array,
    ownerId: mongoose.SchemaTypes.ObjectId,
    Type: String,
    Tags: Array,
    category: {
        bestseller: {
            type: Array
        },
        snacks: {
            type: Array
        }, 
        soup: {
            type: Array
        },
        starters: {
            type: Array
        },
        roti: {
            type: Array
        },
        dessert: {
            type: Array
        },
        rice: {
            type: Array
        },
        shakes: {
            type: Array
        },
    },

    Total_orders: Number

});

const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;