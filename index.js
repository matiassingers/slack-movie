'use strict';

var http = require('http');
var querystring = require('querystring');
var movie = require('node-movie');
var slack = require('slack-notify')(process.env.SLACK_HOOK_URL);

var config =  {
  username: process.env.USERNAME || 'movies',
  emoji: process.env.EMOJI || ':movie_camera:',
  token: process.env.SLACK_TOKEN || void 0
};

http.createServer(function (req, res) {
  var body = '';
  req.on('data', function(chunk) {
    body += chunk;
  });

  req.on('end', function() {
    res.writeHead(200, "OK", {'Content-Type': 'text/html'});
    res.end();

    body = querystring.parse(body);
    console.log(body);

    handlePayload(body);
  });
}).listen(process.env.PORT || 1337);

function handlePayload(body){
  if(config.token && config.token !== body.token){
    return console.error('Token `' + body.token + '` didn\'t match environment variable');
  }

  movie(body.text, function(err, result){
    if(err){
      return console.error(err);
    }

    console.log(result);

    slack.send({
      username: config.username,
      icon_emoji: config.emoji,
      channel: body.channel_id,
      text: '_' + body.command + ' ' + body.text + '_',
      attachments: [{
        title: result.Title,
        title_link: 'http://www.imdb.com/title/' + result.imdbID,
        color: '#FFB10A',
        image_url: result.Poster,
        fields: [{
          title: 'Rating',
          value: result.imdbRating + ' (' + result.imdbVotes + ' votes)',
          short: true
        }, {
          title: 'Year',
          value: result.Year,
          short: true
        }, {
          title: 'Runtime',
          value: result.Runtime,
          short: true
        }, {
          title: 'Director',
          value: result.Director,
          short: true
        }, {
          title: 'Actors',
          value: result.Actors
        }]
      }]
    });
  });
}
