import React, { Fragment } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import PlaylistHeader from './PlaylistHeader'
import PlaylistRow from './PlaylistRow';
import './PlaylistTable.css';
import { Link, Redirect, NavLink } from 'react-router-dom';
import axios from 'axios';

class PlaylistTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playlist: "NULL",
      playlist_comments: "NULL",
      profile: false
    };
  }

  componentDidMount() {

    var playlist_id = this.props.playlist_id
    var playlist_name = encodeURIComponent(this.props.playlist_name)
    var access_token = this.props.access_token
    var url_string = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
    var accumulated_playlist = []
    var more_tracks = true
    var playlist_comments_url_local = `http://localhost:4500/playlist_comments/${playlist_id}/${playlist_name}`

    var playlist_tracks_url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
    var stuff = `https://api.spotify.com/v1/me`
    var playlist_tracks_url_local = `http://localhost:3223/get_all_playlist_tracks/${playlist_id}/${access_token}`
   
    // Call to the Spotify server...
    var SpotifyRequestPromise = axios.get( playlist_tracks_url_local )
    var DatabaseRequestPromise = axios.get( playlist_comments_url_local  )
    axios.all([SpotifyRequestPromise, DatabaseRequestPromise]).then(axios.spread((...responses) => {
      const spotify_response = responses[0]
      const db_response = responses[1]
      this.setState({
          playlist: spotify_response.data, 
          playlist_comments : db_response.data.playlist_comments // getting an *object* of comments
        })
      })
    )
  }

  render() {

    return (
      <Fragment>
        <div className="PlaylistTable">

          {/* <Link to="/">Sign out</Link> */}

          {this.state.playlist != 'NULL' &&
              <div className="PlaylistName">
              {this.props.playlist_name} 
              </div>
          }
      
                <table className='PlaylistTable'> 

                {/* <col className = "TestColumn" ></col>
                <col className = "TestColumn" ></col>
                <col className = "TestColumn" ></col>
                <col className = "TestColumn" ></col> */}

                  {this.state.playlist != 'NULL' && <PlaylistHeader/> }

                  {this.state.playlist != 'NULL' &&
                  this.state.playlist_comments != "NULL" && 
                  this.state.playlist
                  .sort(
                    (song1, song2) => !( song2.added_at - song1.added_at )
                  )
                  .map(
                    song => <PlaylistRow
                    playlist_id = {this.props.playlist_id} 
                    user = {this.props.display_name} 
                    song_title = {song.track.name}
                    artist = {song.track.artists[0].name}
                    date_added = {song.added_at}
                    song_id = {song.track.id}
                    // added_by = {song.added_by.id}
                    song_comments = { typeof(this.state.playlist_comments) === 'undefined' ? undefined : this.state.playlist_comments[`${song.track.id}`] }
                    />
                  )}

                </table>

        </div>

       
      </Fragment>
    );
  }
};

export default PlaylistTable;