var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var MongoClient = require("mongodb").MongoClient

// Taken from CosmosDB instance on Azure...
var url = "mongodb://bp-db:WAowx88FJvtWo4YvTTW9LtLpcd2Vyf4ZzQJNP7sAMLIuwCW1UgjGe2P8w3D4bQfeMoPbwEzs7nOe2QqRiZWsHw%3D%3D@bp-db.documents.azure.com:10255/?ssl=true";
var url_local = "mongodb://localhost:27017"
// var url_local = 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false'
var database_port = 4500;

var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
app.use(cors())

// Get a playlist's comments.
// If the playlist doesn't exist, create a MongoDB document with an empty
// ...playlist_comments array.
app.get("/playlist_comments/:playlist_id/:playlist_name", function (req, res) {
  // console.log("in playlist_comments")

  MongoClient.connect(url_local, function(err, client) {
    var requested_playlist_id = req.params.playlist_id,
        playlist_name = req.params.playlist_name
    // Make DB call, and send back json object of data
    var db = client.db("playlist_info")
    db.collection('commentary_new').findOne({_id: requested_playlist_id},
      {projection: {_id:0, playlist_comments:1,}}, function(err, result) {
      if (err) throw err
      // if you found something, send it back.
      else if (result != null) {
        // FUTURE WORK (SEE TODOIST):
        // FILTER OUT THE "song" MongoDB field before sending the
        // playlist data to the frontend.
        res.json(result);
      }
      else {
        
        db.collection('commentary_new').insertOne({
          _id: requested_playlist_id,
          playlist_name : playlist_name,
          playlist_comments: {}
        })
        res.send("Playlist wasn't in database. Created an empty MongoDB document for it.")
      }
    client.close()
    })
  })
})

// Goal: retrieve an entire playlist's comments in one API call.

// Idea: once a playlist is loaded (from PlaylistSelector component), make a call to this one function.
// ...then, simply pass the comment object corresponding to each song ID to each row (where one row = one song)
// ...and proceed as normal. This avoids making many calls to the database server at one time.

// Input: a Spotify playlist ID
// First attempt with the new experimental collection, "commentary_new"

// 2 options when posting:
// 1) song already exists in document (and therefore has at least 1 comment)

// 2) song doesn't exist in document and needs to be added, along 
// ... with its associated comment

app.post("/post_comment", function (req, res) {
  console.log("in post_comment Express function")
  var comment = req.body.comment,
    date_and_time = req.body.date_and_time,
    song_title = req.body.song_title,
    song_id = req.body.song_id,
    playlist_id = req.body.playlist_id,
    user = req.body.user,
    mongo_db_field_update_song_title = `playlist_comments.${song_id}.song`,
    mongo_db_field_update_song_comments = `playlist_comments.${song_id}.song_comments`,
    artist = req.body.artist

  var song = `${song_title} by ${artist}`

  var comment_info = {
    comment: comment,
    date_and_time: date_and_time,
    user: user
  }

  MongoClient.connect(url_local, function(err,client) {
    if (err) throw err;
    var db = client.db("playlist_info")

    db.collection('commentary_new').updateOne(
      {_id : playlist_id },
      { 
        $set: { 
          [mongo_db_field_update_song_title] : song
        }
      } 
    )

    db.collection('commentary_new').updateOne(
      {_id : playlist_id },
        { 
          $push: { [mongo_db_field_update_song_comments]: comment_info }
        } 
    )

    client.close()
    }
  )
  res.send("Comment posted to database. Awesome.")
  }
)

// Delete a comment
app.post("/delete_comment", function (req, res) {
  console.log("in post_comment Express function")
  var deletion_date_and_time = req.body.date_and_time,
    song_id = req.body.song_id,
    playlist_id = req.body.playlist_id,
    mongo_db_field_update_song_comments = `playlist_comments.${song_id}.song_comments`

  MongoClient.connect(url_local, function(err,client) {
    if (err) throw err
    var db = client.db("playlist_info")
    db.collection('commentary_new').updateOne(
      {_id : playlist_id },
      { 
          $pull : { [mongo_db_field_update_song_comments] : {date_and_time: deletion_date_and_time }   }
      } 
    )

    client.close()
    }
  )
  res.send("Comment deleted.")
  }
)

console.log(`Database server starting on ${database_port}`)
app.listen(database_port);

