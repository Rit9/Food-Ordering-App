// 07/08/2020 - 10:30
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    hotelId: mongoose.SchemaTypes.ObjectId,

    orderItems: {
        item_id: [
            {type: mongoose.SchemaTypes.ObjectId}
        ],
        item_qty: [
            {type: Number}
        ]
    },

    total_amt: {
        type: Number
    },

    status: {
        type: String
    },
    // 3 values: Order added to cart = "in_cart", Payment done = "pending", Food item ready/Validated the user at the time of order pickup = "completed"

    // Date: String,
    // Enabled timestamps for this purpose...

    customerId: mongoose.SchemaTypes.ObjectId

}, {
    timestamps: true
});
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;