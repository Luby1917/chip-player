express    = require('express');
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var cors       = require('cors');
var kue        = require('kue');
var spawn      = require('child_process').spawn;
var fs         = require('fs');



var queue      = kue.createQueue();
var app        = express();

var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(cors());

app.use('/',express.static(__dirname + '/public/'));//point to public folder to serve static content

var router = express.Router();

router.get('/data', function(req, res, next) {
  res.json("activities");
});


app.use(function(req, res, next){
  res.sendStatus(404);
});
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.sendStatus(500);
});


const musicFolder = '/media/usb/music/';

kue.Job.rangeByState( 'enqueue', 0, 10000, 'asc', function( err, jobs ) {
  if(!jobs.length){
    fs.readdir(musicFolder, function(err, files) {
      if(files){
        files.forEach(function(file){
          music_file =  musicFolder+file;
          console.log(music_file);
          var job = queue.create('music', {
              title: file,
              file: music_file
          })
          .removeOnComplete( true )
          .save( function(err){
             if( !err ) console.log( job.id );
          });
        });
      }
    })
  }
});





queue.process('music', function(job, done){
  console.log("PROCESS");
  play_file(job.data.file, done);
});

function play_file(file_name, done) {
  if(file_name) {
    var player = spawn('mplayer', ['-cache', '1024', file_name ]);

    player.stdout.on('data', function (data) {
      //setTimeout(function(){done();}, 5000);
    });

    player.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    player.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      if(code === 0){//GOOD
        done();
      }else {       //BAD
        return done(new Error('Error playing file'));;
      }
    });

    player.on('error', function (code) {
      console.log('error ' + code);
      return done(new Error('Error playing file'));
    });
  }
}

kue.app.listen(3030);
app.listen(3000, function () {
  console.log('ChipPlayer listening on port 3000!');
});
