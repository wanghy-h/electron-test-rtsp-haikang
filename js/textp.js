const { ipcRenderer } = require('electron')
var fs = require('fs'), http = require('http'), WebSocket = require('ws')
function init () {
  // 监听mian process里发出的message
  ipcRenderer.on('asynchronous-reply', (event, arg) => {
    alert('web2' + arg) // prints "pong"  在electron中web page里的console方法不起作用，因此使用alert作为测试方法
  })
}

function say_hello () {
  // 在web page里向main process发出message
  ipcRenderer.send('asynchronous-message', 'ping') // prints "pong"
  ipcRenderer.sendSync('synchronous-message', 'ping') // prints "pong"
  var username = document.getElementById('userName')
  alert('web1' + 'ping11' + username.value)
}

function snap () {
  // mediaStreamTrack && mediaStreamTrack.stop();
  // var util = require('util'), exec = require('child_process').exec
  // exec(
  //   'ffmpeg -f dshow -i video="USB Camera" -ss 0 -y -vframes 1 E:/code/nodejs/RTSP-Streaming.js/img/foo12.jpeg',
  //   { maxBuffer: 2048 * 1024 },
  //   function (error, stdout, stderr) {
  //     if (error !== null) {
  //       console.error('FFmpegs 192.168.1.3 exec error: ' + error)
  //     }else{
  //       openLocalCamera();
  //     }
  //   }
  // )
  var video = document.querySelector('video')
  var canvas = document.getElementById('canvas')
  var img = document.getElementById('img')
  // 绘制canvas图形
  canvas.getContext('2d').drawImage(video, 0, 0, 1280, 720)

  // 把canvas图像转为img图片
  var src = canvas.toDataURL('image/img')
  img.src = src

  // 过滤data:URL
  var base64Data = src.replace(/^data:image\/\w+;base64,/, '')
  var dataBuffer = new Buffer(base64Data, 'base64')
  fs.writeFile('image.jpg', dataBuffer, function (err) {
    if (err) {
      console.log(err.message)
    } else {
    }
  })
}

function onloadPage () {
  startCameraServer(8081, 8082, 'supersecret1')
  var util = require('util'), exec = require('child_process').exec
  exec(
    'ffmpeg  -i rtsp://admin:aaaa8888@192.168.1.6:554/h264/ch1/main/av_stream/ -f mpegts -codec:v mpeg1video -s 320x240 -b:v 100k -bf 0 http://localhost:8081/supersecret1',
    { maxBuffer: 2048 * 1024 },
    function (error, stdout, stderr) {
      if (error !== null) {
        console.error('FFmpegs 192.168.1.3 exec error: ' + error)
      }
    }
  )

  startCameraServer(8083, 8084, 'supersecret2')
  var util = require('util'), exec = require('child_process').exec
  exec(
    'ffmpeg  -i rtsp://admin:aaaa8888@192.168.1.4:554/h264/ch1/main/av_stream/ -f mpegts -codec:v mpeg1video -s 320x240 -b:v 500k -bf 0 http://localhost:8083/supersecret2',
    { maxBuffer: 2048 * 1024 },
    function (error, stdout, stderr) {
      if (error !== null) {
        console.error('FFmpegs 192.168.1.4 exec error: ' + error)
      }
    }
  )

  startCameraServer(8085, 8086, 'supersecret3')
  var util = require('util'), exec = require('child_process').exec
  exec(
    'ffmpeg  -i rtsp://admin:aaaa8888@192.168.1.5:554/h264/ch1/main/av_stream/ -f mpegts -codec:v mpeg1video -s 320x240 -b:v 500k -bf 0 http://localhost:8085/supersecret3',
    { maxBuffer: 2048 * 1024 },
    function (error, stdout, stderr) {
      if (error !== null) {
        console.error('FFmpegs 192.168.1.5 exec error: ' + error)
      }
    }
  )

  startCameraServer(8087, 8088, 'supersecret4')
  var util = require('util'), exec = require('child_process').exec
  exec(
    'ffmpeg  -i rtsp://admin:aaaa8888@192.168.1.6:554/h264/ch1/main/av_stream/ -f mpegts -codec:v mpeg1video -s 320x240 -b:v 500k -bf 0 http://localhost:8087/supersecret4',
    { maxBuffer: 2048 * 1024 },
    function (error, stdout, stderr) {
      if (error !== null) {
        console.error('FFmpegs 192.168.1.6 exec error: ' + error)
      }
    }
  )
}

function startCameraServer (httpProt, socketPort, secret) {
  // Websocket Server
  var socketServer = new WebSocket.Server({
    port: socketPort,
    perMessageDeflate: false
  })
  socketServer.connectionCount = 0
  socketServer.on('connection', function (socket, upgradeReq) {
    socketServer.connectionCount++
    console.log(
      'New WebSocket Connection: ',
      (upgradeReq || socket.upgradeReq).socket.remoteAddress,
      (upgradeReq || socket.upgradeReq).headers['user-agent'],
      '(' + socketServer.connectionCount + ' total)'
    )
    socket.on('close', function (code, message) {
      socketServer.connectionCount--
      console.log(
        'Disconnected WebSocket (' + socketServer.connectionCount + ' total)'
      )
    })
  })
  socketServer.broadcast = function (data) {
    try {
      socketServer.clients.forEach(function each (client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data)
        }
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
  var streamServer = http
    .createServer(function (request, response) {
      var params = request.url.substr(1).split('/')

      if (params[0] !== secret) {
        console.log(
          'Failed Stream Connection: ' +
            request.socket.remoteAddress +
            ':' +
            request.socket.remotePort +
            ' - wrong secret.'
        )
        response.end()
      }

      response.connection.setTimeout(0)
      console.log(
        'Stream Connected: ' +
          request.socket.remoteAddress +
          ':' +
          request.socket.remotePort
      )
      request.on('data', function (data) {
        socketServer.broadcast(data)
        if (request.socket.recording) {
          request.socket.recording.write(data)
        }
      })
      request.on('end', function () {
        console.log('close')
        if (request.socket.recording) {
          request.socket.recording.close()
        }
      })

      // Record the stream to a local file?
      if (false) {
        var path = 'recordings/' + Date.now() + '.ts'
        request.socket.recording = fs.createWriteStream(path)
      }
    })
    .listen(httpProt)

  console.log(
    'Listening for incomming MPEG-TS Stream on http://127.0.0.1:' +
      httpProt +
      '/<secret>'
  )
  console.log(
    'Awaiting WebSocket connections on ws://127.0.0.1:' + socketPort + '/'
  )
}
