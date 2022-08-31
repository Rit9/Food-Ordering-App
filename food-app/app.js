require('dotenv').config();
const express = require("express");
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');
const findOrCreate = require("mongoose-findorcreate");
const mailer = require("./utils/mailer");
const crypto = require("crypto");
const path = require("path")
const bcrypt = require("bcryptjs")
// const Router = require("router")

mongoose.set('useFindAndModify', false);

// import models
const FoodItem = require('./src/models/fooditem');
const Hotel = require('./src/models/restaurant');
const Order = require('./src/models/order');
const Owner = require('./src/models/owner');
const { findOne } = require('./src/models/fooditem');

const app = express();
app.use(express.static(__dirname + '/public'));
// app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://user0:5tdMo2WoXKaskRVe@cluster0.5dbvc.gcp.mongodb.net/project-db?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true });
mongoose.set('useCreateIndex', true);

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    phone: String,
    active: {
        type: Boolean,
        default: false
    },
    activeToken: String,
    activeExpires: Date,
    forgotToken: String,
    forgotExpires: Date,
    googleId: String
});

userSchema.plugin(passportlocalmongoose, { usernameField: "email" });
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/food",
// },
//     function (accessToken, refreshToken, profile, cb) {
//         User.findOrCreate({ googleId: profile.id, email: profile.emails[0].value, mobileg: false }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));


// app.get('/auth/google',
//     passport.authenticate('google', {
//         scope: ['https://www.googleapis.com/auth/userinfo.profile',
//             'https://www.googleapis.com/auth/userinfo.email']
//     })
// );

// app.get('/auth/google/food',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function (req, res) {
//         res.redirect('/index');
// });


app.get("/", (req, res) => {
    res.render("welcome");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/index", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index")
    } else {
        res.render("login");
    }
})

app.get("/forgot", (req, res) => {
    res.render("forgot");
})

app.get("/menu", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("menu");
    } else {
        res.render("login");
    }
})

app.get("/menuform", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("menuform")
    } else {
        res.render("login")
    }
})

app.get("/cart", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("cart");
    } else {
        res.render("login");
    }
})

app.get("/ownerapp", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("ownerapp");
    } else {
        res.render("login");
    }
})

// 07/08/2020 - 2:30
app.get("/ownerappdata", async (req, res) => {
    if (req.isAuthenticated()) {
        var food_item = await FoodItem.findOne({ name: req.query.itemname, hotelId: req.query.resid });

        if (!food_item) {
            // Saving the new food item to fooditems collection
            food_item = new FoodItem({
                hotelId: req.query.resid,

                profileURL: req.query.profileURL,

                name: req.query.itemname,

                price: req.query.price,

                tag: [req.query.ingred1, req.query.ingred2],

                Type: req.query.type,

                Total_orders: 0 // *DEFAULT*
            })

            await food_item.save();

            const restaurant = await Hotel.findById(req.query.resid);

            // Adding the new food item id to respective hotel menu
            restaurant.menu.push(food_item._id);

            // For allowing the owner to put the item in a category :-
            const cat = restaurant.category[req.query.category];
            cat.push(food_item._id);

            await restaurant.save();
            res.render("ownerapp");
        } else {
            res.render("ownerapp");
        }
    } else {
        res.render("login");
    }
});
// NOTE - Didn't include lodash package yet (Case sensitive as of now)
// Had to use GET instead of POST
// Used query string method (long one) to get the data of the request.

// 07/08/2020 - 23:30
app.get('/menuformdata', async (req, res) => {
    if (req.isAuthenticated()) {
        // include condition so that a new order doc will be created when user adds items to cart after paying for prev order...
        var order = await Order.findOne({ status: 'in_cart', customerId: req.query.userid });
        if (!order) {
            order = new Order({
                status: 'in_cart', // *DEFAULT*

                customerId: req.query.userid,

                hotelId: req.query.resid,
            });

            const IDs = [];
            const QTYs = [];
            IDs.push(req.query.item1id, req.query.item2id, req.query.item3id);
            QTYs.push(req.query.item1qty, req.query.item2qty, req.query.item3qty);

            const ids_topush = IDs.filter((id) => id !== '');
            const qtys_topush = QTYs.filter((qty) => qty !== '');

            order.orderItems.item_id.push(...ids_topush);
            order.orderItems.item_qty.push(...qtys_topush);


            const item_prices = [];
            for (id of order.orderItems.item_id) {
                const item = await FoodItem.findById(id);
                item_prices.push(item.price);
            }
            
            const iterations = order.orderItems.item_id.length;
            var total = 0;
            for (var i = 0; i < iterations; i++) {
                total += item_prices[i] * order.orderItems.item_qty[i];
            }
            order.total_amt = total;

            await order.save();
        } else {
            // Redundant code :(

            // *** CONTAINS BUGS ***

            const IDs = [];
            const QTYs = [];
            IDs.push(req.query.item1id, req.query.item2id, req.query.item3id);
            QTYs.push(req.query.item1qty, req.query.item2qty, req.query.item3qty);

            var ids_topush = IDs.filter((id) => id !== '');
            var qtys_topush = QTYs.filter((qty) => qty !== '');
            
            // 11/08/2020 - To ensure that same item id can not be added as a new element in item_id array of orderItems.
            const for_loop_outer = ids_topush.length;
            const for_loop_inner = order.orderItems.item_id.length;
            
            var item_id = order.orderItems.item_id;
            var item_qty = order.orderItems.item_qty;
            
            var modified;
            for (var i = 0; i < for_loop_outer; i++) {
                modified = false;
                for (var j = 0; j < for_loop_inner; j++) {
                    if (item_id[j] === ids_topush[i]) {
                        item_qty[j] += qtys_topush[i];
                        modified = true;
                        break; 
                    }
                }
                if (modified === false) {
                    item_id.push(ids_topush[i]);
                    item_qty.push(qtys_topush[i]);
                }
            }
            
            // var assigned;
            // for (idpush of ids_topush) {
            //     assigned = false;
            //     for (id of order.orderItems.item_id) {
            //         if (id === idpush) {
            //             const index_l = order.orderItems.item_id.indexOf(id);
            //             order.orderItems.item_qty[index_l] += qtys_topush[index_l];
            //             assigned = true;
            //             break; 
            //         }
            //     }
            //     if (assigned === false) {
            //         const index = ids_topush.indexOf(idpush);
            //         order.orderItems.item_id.push(idpush);
            //         order.orderItems.item_qty.push(qtys_topush[index]);
            //     }
            // }

            // order.orderItems.item_id.push(...ids_topush);
            // order.orderItems.item_qty.push(...qtys_topush);

            order.orderItems.item_qty = item_qty;
            order.orderItems.item_id = item_id;

            const item_prices = [];
            for (id of order.orderItems.item_id) {
                const item = await FoodItem.findById(id);
                item_prices.push(item.price);
            }
            
            const iterations = order.orderItems.item_id.length;
            var total = 0;
            for (var i = 0; i < iterations; i++) {
                total += item_prices[i] * order.orderItems.item_qty[i];
            }
            order.total_amt = total;

            // order.markModified('orderItems.item_id');
            // order.markModified('orderItems.item_qty');
            await order.save();
        }
        } else {
            res.render("login")
        }
    });
// Flaws associated with this request -
// 1) Used query string method (long one) to get the data of the request => resulted in a long code + had to use GET instead of POST.
// 2) Update 'Total_Orders' - But this should be done after completion of order only.
// 3) Update 'Purchase_List' - But this should be done after completion of order only.
// 4) Same object id can be added as a new element in item_id array of orderItems.

// 10/08/2020 - 14:00
app.post("/add", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            var order = await Order.findOne({ status: 'in_cart', customerId: req.body.user_id });
            if (!order) {
                throw new Error("There's nothing in cart");
            } else {
                const item = await FoodItem.findById(req.body.item_id);
                const price = item.price;
                var total_to_asgn = order.total_amt;
                total_to_asgn += price;

                const index = order.orderItems.item_id.indexOf(req.body.item_id);
                var array_to_asgn = order.orderItems.item_qty;
                array_to_asgn[index]++;
                
                order = await Order.findOne({ customerId: req.body.user_id });
                order.orderItems.item_qty = array_to_asgn;
                order.total_amt = total_to_asgn;    

                await order.save();
                res.render('index');
            }
        } catch (e) {
            res.send({
                error: e   // Not showing the error msg ?! 
            });
        }
    } else {
        res.render("login");
    }
});

// 11/08/2020 - 00:00
app.post("/subtract", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            var order = await Order.findOne({ status: 'in_cart', customerId: req.body.user_id });
            if (!order) {
                throw new Error("There's nothing in cart");
            } else {
                const item = await FoodItem.findById(req.body.item_id);
                const price = item.price;
                var total_to_asgn = order.total_amt;
                total_to_asgn -= price;

                const index = order.orderItems.item_id.indexOf(req.body.item_id);
                var array_to_asgn = order.orderItems.item_qty;
                array_to_asgn[index]--;
                
                order = await Order.findOne({ customerId: req.body.user_id });
                order.orderItems.item_qty = array_to_asgn;
                order.total_amt = total_to_asgn;    

                await order.save();
                res.render('index');
            }
        } catch (e) {
            res.send({
                error: e   // Not showing the error msg ?! 
            });
        }
    } else {
        res.render("login");
    }
});

// 31/08/20
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'transfertoenv')
        const owner = await findOne({ _id: decoded._id, 'tokens.token': token })
        
        if (!owner) {
            throw new Error()
        }

        req.owner = owner
        next()
    } catch (e) {
        res.render('ownerlogin')
    }
}
// app.use(auth) // Is it required?  

// 14/08/2020 - 21:00
app.get('/owner', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('owner');
    } else {
        res.render('login');
    }
});

// 14/08/2020 - 21:00
app.get('/ownerRegister', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('ownerRegister');
    } else {
        res.render('login');
    }
});

// 14/08/2020 - 21:30 // HOW TO ENSURE UNIQUENESS???
app.post('/ownerRegister', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const owner = new Owner({
                name: req.body.ownername,
                phone: req.body.phone,
                altPhone: req.body.altphone,
                address: req.body.address,
                password: req.body.password
            });

            await owner.save();
            await owner.generateAuthToken()
            res.render('ownerRegister'); 
// Although in actual, we'll need to proceed to hoteldetails page but lite for now...
        } catch (e) {
            res.send({
                error: 'Something went wrong'
            });
        }
    } else {
        res.render('login');
    }
});

// 14/08/2020 - 21:00
app.get('/ownerlogin', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('ownerlogin');
    } else {
        res.render('login');
    }
});

// 15/08/2020
app.post('/ownerlogin', async (req, res) => {
    const owner = await Owner.findOne({ name: req.body.name });
    if (!owner) {
        res.send({
            error: 'Ensure your name and password are inputted correctly (both case sensitive)'
        });
    } else {
        const isMatch = await bcrypt.compare(req.body.password, owner.password)

        if (isMatch) {
            await owner.generateAuthToken()
            res.render('owner');
        } else {
            res.send({
                error: 'Ensure your name and password are inputted correctly (both case sensitive)'
            });
        }
    }
});

// 14/08/2020 - 21:00
app.get('/orderstatus', auth, (req, res) => {
    // if (req.isAuthenticated()) {
        res.render('orderstatus');
    // } else {
    //     res.render('login');
    // }
});

// 15/08/2020
app.post('/complete', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await Order.findByIdAndUpdate(req.body.order_id, { status: 'completed' });
            res.render('orderstatus');
        } catch (e) {
            res.send({
                error: 'Something went wrong'
            });
        }
    } else {
        res.render('login');
    }
});

// 14/08/2020 - 21:00
app.get('/hotelstatus', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('hotelstatus');
    } else {
        res.render('login');
    }
});

// 15/08/2020
app.post('/hotelstatus/close', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await Hotel.findByIdAndUpdate(req.body.hotel_id, { status: 'Closed' });
            res.render('hotelstatus');
        } catch (e) {
            res.send({
                error: 'Something went wrong'
            });
        }
    } else {
        res.render('login');
    }
});

// 15/08/2020
app.post('/hotelstatus/open', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await Hotel.findByIdAndUpdate(req.body.hotel_id, { status: 'Open' });
            res.render('hotelstatus');
        } catch (e) {
            res.send({
                error: 'Something went wrong'
            });
        }
    } else {
        res.render('login');
    }
});

// 14/08/2020 - 21:00
app.get('/hoteldetail', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('hoteldetail');
    } else {
        res.render('login');
    }
});

// 23/08/2020
app.post('/hotelregister', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            let hotel = await Hotel.findOne({ name: req.body.name })
            if (hotel) {
                throw new Error('Already registered!')
            } else {
                const owner = await Owner.findOne({ name: req.body.ownername })
                const ownerID = owner._id
                hotel = new Hotel({
                    _id: new mongoose.Types.ObjectId(),
                    menu: [],
                    Tags: [ req.body.tag1, req.body.tag2 ],
                    name: req.body.name,
                    description: req.body.description,
                    phone: req.body.phone,
                    profileURL: req.body.profileURL,
                    timing: req.body.timing,
                    menuCardPhoto: req.body.menuURL,
                    status: 'Closed',
                    ownerId: ownerID,
                    Type: req.body.type,
                    Total_orders: 0
                })

                await hotel.save()

                owner.hotelId = hotel._id
                await owner.save()

                res.render('hoteldetail')
            }
        } catch (e) {
            res.send({
                error: `Something went wrong. ${e}`
            })
        }
    } else {
        res.render('login')
    }
})

app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/");
})


app.get('/account/active/:activeToken', function (req, res, next) {

    User.findOne({
        activeToken: req.params.activeToken,
        // check if the expire time > the current time       
        activeExpires: { $gt: Date.now() }
    }, function (err, user) {
        if (err) return next(err);

        // invalid activation code
        if (!user) {
            return res.render('register');
            //<--------- add flash message - expiry of token. sign up again --------->
        }

        // activate and save
        user.active = true;
        user.save(function (err, user) {
            if (err) return next(err);

            // activation success
            res.render('index')
            //<--------- add flash - successfully logged in ------->
        });
    });

});


app.post("/register", (req, res) => {

    Users = new User({
        email: req.body.email,
        username: req.body.username,
        phone: req.body.phone,
    });

    //<------add flash message - required email, username, password, mobile------>

    User.register(Users, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, () => {
                // res.redirect("/success1");
                if (req.isAuthenticated()) {

                    // Generate 20 bit activation code, ‘crypto’ is nodejs built in package.
                    crypto.randomBytes(20, function (err, buf) {

                        // Ensure the activation code is unique.
                        user.activeToken = user._id.toString('hex');

                        // Set expiration time is 24 hours.
                        user.activeExpires = Date.now() + 2 * 60 * 1000;
                        var link = 'http://localhost:3000/account/active/'
                            + user.activeToken;

                        // Sending activation email
                        mailer.send({
                            to: req.body.email,
                            subject: 'Welcome',
                            html: 'Please click <a href="' + link + '"> here </a> to activate your account.'
                        });

                        // save user object
                        user.save(function (err, user) {
                            if (err) return next(err);
                            res.render("register");
                            //<------add flash message - check your email to activate account------>

                            // res.send('The activation email has been sent to' + user.email + ', please click the activation link within 2 minutes.');

                        });
                    });

                } else {
                    res.render("/login");
                    // <-------flash message - user with this email id already exist---->
                }
            })
        }
    });

});


app.post("/login", (req, res) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
    })

    User.findOne({ email: req.body.email, active: true }, function (error, founduser) {
        if (error) return next(error);
        if (!founduser) res.render("register");//<------flash message - either email is not registered or email has not been activated ------->
        req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.redirect("/login");
                //<--------flash message-  email id and password not match--------->
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/index");
                })
            }
        })
    });
})


app.post("/forgot", (req, res) => {

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) return next(err);

        // not registered
        if (!user) {
            return res.render('register');//<--------flash message - user with this mail id does not exist please register--------->
        } else if (!user.active) {
            //<------- flash message -  "Account not active. please activate your account first" ------->
            res.render("welcome")
        }
        else {
            // Generate 20 bit reset token, ‘crypto’ is nodejs built in package.
            crypto.randomBytes(20, function (err, buf) {

                // Ensure the activation code is unique.
                user.forgotToken = user._id.toString('hex');

                // Set expiration time is 10 minutes.
                user.forgotExpires = Date.now() + 10 * 60 * 1000;
                var link = 'http://localhost:3000/account/forgotpsw/' + user.forgotToken;

                // Sending activation email
                mailer.send({
                    to: req.body.email,
                    subject: 'Reset Password Link',
                    html: 'Please click <a href="' + link + '"> here </a> to reset account password.'
                });

                // save user object
                user.save(function (err, user) {
                    if (err) return next(err);
                    res.render("welcome");//<-------flash - check your email to set new password---->

                    // res.send('email has been sent to ' + user.email + ', please click the reset link to reset account password');
                });
            });

        }
    })

})


app.get('/account/forgotpsw/:resetToken', function (req, res, next) {

    User.findOne({ forgotToken: req.params.resetToken, forgotExpires: { $gt: Date.now() } }, function (err, user) {
        if (err) return next(err);

        // invalid forgotToken
        if (!user) {
            return res.render('reset');
            //<------ flash - invalid token ------>
        }
        res.render('reset');
    });

});


app.post("/reset", (req, res) => {

    if (req.body.password === req.body.repassword) {
        User.findOne({ email: req.body.email }, function (err, foundUser) {
            if (err) {
                console.log(err);
            }
            console.log(foundUser);
            if (foundUser) {
                foundUser.setPassword(req.body.password, function () {
                    foundUser.forgotToken = "";
                    foundUser.forgotExpires = "";
                    foundUser.save();
                    res.render("login");
                });
            } else {
                res.render("register");
                //<------flash - user with this email does not exist ------>
            }
        });
    }

})


app.listen(3000, function () {
    console.log("server started at port 3000");
})