const passport = require('passport');

exports.protected = passport.authenticate('jwt', {
    session: false
});