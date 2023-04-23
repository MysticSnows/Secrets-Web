require('dotenv').config();
// const md5 = require('md5');   // usage: md5(password)
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();

const saltRounds = 10;
// export module
const User = require(__dirname + "/custom_modules/userModel.js");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const connectDB = async ()=> {
  const conn = await mongoose.connect("mongodb://127.0.0.1:27017/userDB")
  
  console.log(`Successfully connected: ${conn.connection.host} at DB: ${conn.connection.name}`);
}
connectDB().catch((err) => {
  console.log(`Error: ${err}`);
});


app.get("/", function(req, res){
  res.render("home");
});

// Login Route
app.route("/login")
.get(function(req, res){
  res.render("login");
})
.post(async function(req, res){
  try{
    const username = req.body.username;
    const pass = req.body.password;
    const user = await User.findOne({email: username});
    if(pass.length != 0 && bcrypt.compareSync(pass, user.password)){
      res.render("secrets");
    } else {
      res.send("Username and Password do not match");
    }
  } catch(err){
    res.send("Error: " + err);
  }
})

// Register Route
app.route("/register")
.get(function(req, res){
  res.render('register');
})
.post(function(req, res){
  bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
    await User.create({
      email: req.body.username,
      password: hash
    })
    .then(async () => res.render('secrets'))
    .catch((err) => console.log(`Error in Registration: ${err}`));

    if(err){
      console.log(err);
    }
  });
});



app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
