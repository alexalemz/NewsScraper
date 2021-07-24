require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const request = require("request");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

// Initialize Express
const app = express();

const PORT = process.env.PORT || 3000;


// Configure middleware

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI //|| "mongodb://localhost/mongoHeadlines";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


// Routes

// Route for the homepage
app.get("/", function(req, res) {
  db.Article.find({}).sort({date: -1}).lean()
    .then(function(dbArticle) {
      res.render("index", {
        articles: dbArticle
      });
    })
    .catch(function(err) {
      res.json(error);
    });
});

// Set the date property for all articles
app.get("/setDates", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      dbArticle.forEach(function(article) {
        // console.log(article);

        let date = article.link.match(/\d\d\d\d\/\d\d\/\d\d/gi).join("");
        // console.log(date.join(""));

        article.date = date;
        article.save();
      });

      res.send("done");
    })
})

// Route for scraping data from a news site and creating Articles in the db.
app.get("/scrape", function(req, res) {
  var siteUrl = "https://www.npr.org/sections/news/";
  request(siteUrl, function(error, response, body) {
    var $ = cheerio.load(body);

    $("article.item").each(function(i, element) {
      var article = {};
      article.title = $(element).find("h2.title a").text();
      article.link = $(element).find("h2.title a").attr("href");
      article.date = article.link.match(/\d\d\d\d\/\d\d\/\d\d/gi).join("");

      // Get the summary, without the <time> element.
      $(element).find("p.teaser a time").remove();
      article.summary = $(element).find("p.teaser a").text();

      // Check if an article with that title already exists in the db, before adding it.
      db.Article.findOne({ title: article.title })
        .then(function(exists) {
          if (!exists) {
            return db.Article.create(article);
          }
        })
        .then(function(dbArticle) {
          // View article in console
          console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    })

    res.send("Scrape complete");

  })
});

// Route for getting all Articles from the db.
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populated with its comments.
app.get("/articles/:id", function(req, res) {
  db.Article.findById(req.params.id).populate("comments").lean()
    .then(function(dbArticle) {
      // res.json(dbArticle);
      res.render("article", dbArticle)
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for creating a new Comment and associating it with an Article.
app.post("/articles/:id", function(req, res) {
  var newComment = req.body;

  db.Comment.create(newComment)
    .then(function(dbComment) {
      return db.Article.findByIdAndUpdate(req.params.id, {
        $push: { comments: dbComment._id }
        }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err) {
      res.json(err);
    })
})

// Route for deleting a Comment. (Deletes the comment from the db, and remove its association from its article.)
app.delete("/comments/:id", function(req, res) {
  // Remove its association from its article(s)
  db.Article.update({ comments: req.params.id }, { $pull: { comments: req.params.id }})
    .then(function(dbArticle) {
    // Delete the comment itself
    db.Comment.findByIdAndRemove(req.params.id)
      .then(function(dbComment) {
        res.json(dbComment)
      })
      .catch(function(err) {
        res.json(err)
      })
  })
})

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});