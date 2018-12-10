var util = {};

//request의 인증 확인
util.isLogined = function(req,res,next){
    if(req.session.isAuthenticated){
        return next();
    }
    res.status(403).send();
}

module.exports= util;