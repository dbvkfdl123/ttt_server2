var express = require('express');
var router = express.Router();
const {ObjectId} = require('mongodb');
var util =require('../util'); //직접만든 함수는 Path를 지정해줘야한다.
const bcrypt =require('bcrypt');
const saltRounds = 10;

var ResponseType = {
  INVALID_USERNAME :0,
  INVALID_PASSWORD :1,
  SUCCESS:2,
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//회원가입
router.post('/add',function(req,res,next){
  var username = req.body.username;
  var password = req.body.password;
  var nickname = req.body.nickname;
  //var score = req.body.score;

  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(password, salt);

  var database = req.app.get("database");
  var users = database.collection('users');

  if(username !== undefined && password !== undefined && nickname !== undefined)
  {
      users.insert([{"username": username , "password": hash , "nickname": nickname }], function(err,result){
        res.status(200).send("success");
    });
  }
});

//로그인
router.post('/find',function(req,res,next){
  var username = req.body.username;
  var password =req.body.password;

  var database = req.app.get("database");
  var users = database.collection('users');

  if(username !== undefined && password != undefined){
    users.findOne({username: username},function(err,result){
      if (result) {
        //if (password === result.password) {
          var compareResult = bcrypt.compareSync(password, result.password);
          if(compareResult){
          req.session.isAuthenticated = true;
          req.session.userid = result._id.toString();
          req.session.username =result.username;
          req.session.nickname = result.nickname;

          res.json({result: ResponseType.SUCCESS});
          }else{
            res.json({result:ResponseType.INVALID_PASSWORD});
          }
        } else {
          res.json({result:ResponseType.INVALID_USERNAME});
        }
    });
  }
});



//계정 조회
router.post('/serch',function(req,res,next){
var username = req.body.username;

var database = req.app.get("database");
var users = database.collection('users');

if(username !== undefined){
  users.findOne({username: username}, function(err,result) {
    if(result.score === undefined){
      users.update({username:username},{username:result.username,password:result.password,nickname:result.nickname,score:0},function(err,result){
        users.findOne({username: username}, function(err,result) {
          res.json({username:username,nickname:result.nickname,score:result.score});
        });
      });
    }else{
      res.json({username:result.username,nickname:result.nickname,score:result.score});
    }
  });
}
});

//User Info
router.get('/info',util.isLogined, function(req,res,next){
    res.json({username: req.session.username, nickname: req.session.nickname});
  });

  // 접속조회
  router.get('/who',function(req,res,next){
    if(req.session.isAuthenticated){
      res.json({username: req.session.username, nickname: req.session.nickname});
    }else{
      res.send(req.session.id);
  }
  });


  //Score 추가
  router.get('/addscore/:score',util.isLogined,function(req,res,next){

    var score = req.params.score;
    var userid = req.session.userid;

    var database = req.app.get("database");
    var users = database.collection('users');

    if(userid != undefined){
      users.updateOne({_id: ObjectId(userid)},
      { $set: {
        score:Number(score),
        updatedAt : Date.now()
      }},{upsert:true},function(err){
        if(err){
          res.send(200).send("failure");
        }
        res.status(200).send("success");
      });
    }
  });

  //스코어 불러오기
  router.get('/score',util.isLogined,function(req,res,next){

    var userid = req.session.userid;

    var database = req.app.get("database");
    var users = database.collection('users');

    users.findOne({_id:Object(userid)},function(err,result){
      if(err)throw err;
      
      var resultObj = {
        id: result._id.toString(),
        score: result.score
      }
      res.json({resultObj});
    });
  });
module.exports = router;
