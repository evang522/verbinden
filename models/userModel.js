'use strict';

let mongoose = require('mongoose');
let bcrypt = require('bcryptjs');
// Connect to DB
mongoose.connect('mongodb://localhost/verbinden');



let UserSchema = mongoose.Schema( {
    name: {
        type:String,
    },
    password: {
        type:String,
    },
    email: {
        type:String,
    },
});

let User = module.exports = mongoose.model('User', UserSchema);


module.exports.createUser = (newUser,callback) => {
    bcrypt.genSalt(10, (err,salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            newUser.password =hash;
            newUser.save(callback);
        });
    })
}

module.exports.getUserByEmail = (email, callback) => {
    let query = {email: email};
    User.findOne(query, callback);
}

module.exports.getUserById = (id, callback) => {
    User.findById(id,callback);
}

module.exports.comparePassword = (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if(err) throw err;
        callback(null, isMatch);
    });
}