//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session"); // PP
const passport = require("passport"); // PP
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
// mongoose.set("useCreateIndex", true);

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
const uri =
  "mongodb+srv://anandpatware:<password>@cluster0.kn6tbdp.mongodb.net/?retryWrites=true&w=majority";

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(
  "mongodb+srv://anandpatware:anand@2510@cluster0.kn6tbdp.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  branch: String,
  year: String,
  college: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
const questAndAnswerSchema = new mongoose.Schema({
  email: String,
  quest: String,
  postedBy: userSchema,
  answer: [
    {
      answer: String,
      name: String,
    },
  ],
  likes: Number,
  views: Number,
});

const Question = mongoose.model("Question", questAndAnswerSchema);

passport.use(User.createStrategy()); // PP

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get("/", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("home", { isauth: isauth, currUser: currUser });
});

app.get("/login", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("login", { isauth: isauth, currUser: currUser });
});
app.get("/signup", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("signup", { isauth: isauth, currUser: currUser });
});

app.get("/discussion", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    Question.find({}, function (err, questions) {
      if (err) {
        console.log(err);
      } else {
        res.render("discussion", {
          questions: questions,
          isauth: isauth,
          currUser: currUser,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});
// app.post("/discussion", function (req, res) {
//   res.redirect("/discussion/" + req.body.sortType);
// });
app.get("/ask", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    res.render("ask", { isauth: isauth, currUser: currUser });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout(req.user, (err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get("/answers/:questionId", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    const questionId = req.params.questionId;
    Question.findById(questionId, function (err, question) {
      question.views = question.views + 1;
      question.save();
      res.render("answers", {
        isauth: isauth,
        currUser: currUser,
        question: question,
      });
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/likes/:questionId", function (req, res) {
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    question.likes = question.likes + 1;
    question.save();
    //  console.log(questionId);
    res.redirect("/discussion");
  });
});
app.get("/profile/:userID", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    const userId = req.params.userID;
    var sameUser = 0;

    User.findById(userId, function (err, user) {
      if (currUser._id == userId) {
        sameUser = 1;
        res.render("profile", {
          isauth: isauth,
          currUser: currUser,
          user: user,
          sameUser: sameUser,
        });
      } else {
        res.render("profile", {
          isauth: isauth,
          currUser: currUser,
          user: user,
          sameUser: sameUser,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/signup", function (req, res) {
  User.register(
    {
      username: req.body.username,
      name: req.body.name,
      branch: req.body.branch,
      year: req.body.year,
      college: req.body.college,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/discussion");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/discussion");
      });
    }
  });
});

app.post("/ask", function (req, res) {
  var isauth = 1;
  var currUser = req.user;
  const newQuest = new Question({
    postedBy: currUser,
    quest: req.body.quest,
    likes: 0,
    views: 0,
  });
  newQuest.save();
  res.redirect("/discussion");
});

app.post("/answers/:questionId", function (req, res) {
  var isauth = 1;
  var currUser = req.user;
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    question.answer.push({ answer: req.body.ans, name: currUser.name });
    question.save();
    res.redirect("/answers/" + question._id);
  });
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log("Server started at port 3000");
});
