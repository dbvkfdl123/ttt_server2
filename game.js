const uuidv4 = require('uuid/v4');

module.exports = function(server){
    var rooms =[];

    var io = require("socket.io")(server,{
        transports:['websocket'],
    });

    io.on('connection', function(socket){
        console.log('Connection: '+ socket.id);

        if(rooms.length > 0){
            var rId= rooms.shift();
            socket.join(rId, function(){
                socket.emit('joinRoom', {room: rId});
                io.to(rId).emit('startGame');
            });
        }else{
            var roomName = uuidv4();
            socket.join(roomName, function(){
                socket.emit('createRoom', {room:roomName});
                rooms.push(roomName);
            });
        }

        socket.on('disconnecting', function(reson){ //disconnect 와 disconnecting 의 차이점 disconnect가 먼저 호출됨
            console.log('Disconnected: '+ socket.id);
            var socketRooms = Object.keys(socket.rooms).filter(item => item != socket.id);
            console.dir(socketRooms);

            socketRooms.forEach(function(room){
                socket.broadcast.to(room).emit('exitRoom');
                //혼자 만든 방의 유저가 disconnect 하면 해당방 제거
                var idx=  rooms.indexOf(room);
                if (idx != -1)
                {
                    rooms.splice(idx,1);
                }
            });
            
        });
        socket.on('doPlayer', function(playerInfo){
            var roomId= playerInfo.room;
            var cellIndex = playerInfo.position;
            socket.broadcast.to(roomId).emit('doOpponent',{position: cellIndex});
        });

        socket.on('hi', function(){
            console.log('hi');
            //io.emit('hello'); //io.xx 은 접속한 모든 클라이언트에게 메세지 전달 , socket.xx 는 요청받은 클라이언트에게만 메세지 전달
            //socket.broadcast.emit("hello"); // brodcast 는 요청한 클라이언트를 제외한 모든 클라이언트에게 메세지 전달.

        });

        socket.on('message', function(msg){
            console.dir(msg); //dir 해당 객체의 구조를 볼수있는 명령어
            socket.broadcast.emit('chat',msg);
            //socket.broadcast.emit('chat');
        });
    });
};