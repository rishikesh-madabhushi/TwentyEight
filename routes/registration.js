const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../db/user");

const { check, validationResult } = require('express-validator'); 

router.get("/", function(req, res, next) {
  res.render("registration");
});

router.post("/", [
    check('username_input', 'user name cannot be empty.')
        .not()
        .isEmpty(),
    check('username_input', 'user Admin already exists.')
	.not().equals("Admin"),
    check('password_input', 'password is required')
	.isLength({ min: 3 })
        .custom((val, { req, loc, path }) => {
            if (val !== req.body.password_verify) {
                throw new Error("Passwords don't match");
            } else {
                return val;
            }
        }),
], (req, res) => {
    const { username_input: username, password_input: password } = req.body;
    const errors = validationResult(req).errors;

    if (errors) {
	res.render("registration", { errors: errors });
    } else {
	bcrypt.hash(password, 10).then(hash => {
	    User.createUser(username, hash)
		.then(() => {
		    res.render("login");
		})
		.catch(error => {
		    const { detail } = error;
		    res.render("registration", {
			errors: [
			    {
				msg: detail
			    }
			]
		    });
		});
	});
    }
});

module.exports = router;
