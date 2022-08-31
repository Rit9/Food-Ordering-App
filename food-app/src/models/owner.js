// 07/08/2020 - 10:30
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const ownerSchema = new mongoose.Schema({

    name: {
        type: String,
        unique: true
    },

    // email: String,

    phone: String,

    altPhone: String,

    password: String,

    profileURL: String,

    address: String,

    mobilleOP: Number,

    createdAt: String,

    hotelId: mongoose.SchemaTypes.ObjectId,

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

// 31/08/2020
ownerSchema.methods.generateAuthToken = async function () {
    const owner = this
    //TRANSFER THE SECRET KEY TO .env FILE
    const token = jwt.sign({ _id: owner._id.toString() }, 'transfertoenv')

    owner.tokens = owner.tokens.concat({ token })
    await owner.save()
}

// 27/08/2020
ownerSchema.pre('save', async function (next) {
    const owner = this

    if (owner.isModified('password')) {
        owner.password = await bcrypt.hash(owner.password, 8)
    }

    next()
}) 

const Owner = mongoose.model("Owner", ownerSchema);

module.exports = Owner;