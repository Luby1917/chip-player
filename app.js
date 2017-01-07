express    = require('express');
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var cors       = require('cors');
var kue        = require('kue');



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

var job = queue.create('music', {
    file: 'welcome email for tj'
}).save( function(err){
   if( !err ) console.log( job.id );
});

queue.process('music', function(job, done){
  file(job.data.file, done);
});

function file(file_name, done) {
  if(!file_name) {
    console.log("Proceso");
    return done(new Error('invalid to address'));
  }
  // email send stuff...
  done();
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
