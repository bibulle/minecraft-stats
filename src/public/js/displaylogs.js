$(document).ready(function() {

  $( "#info" ).click(function() {
    if ($( "#container" ).hasClass( "info" )) {
      $( "#info" ).text("Show info");
    } else {
      $( "#info" ).text("Hide info");
    }
    $('#container').toggleClass("info");
  });
  $( "#debug" ).click(function() {
    if ($( "#container" ).hasClass( "debug" )) {
      $( "#debug" ).text("Show debug");
    } else {
      $( "#debug" ).text("Hide debug");
    }
    $('#container').toggleClass("debug");
  });
  $( "#save" ).click(function() {
    if ($( "#container" ).hasClass( "save" )) {
      $( "#save" ).text("Show save");
    } else {
      $( "#save" ).text("Hide save");
    }
    $('#container').toggleClass("save");
  });
  $( "#overload" ).click(function() {
    if ($( "#container" ).hasClass( "overload" )) {
      $( "#overload" ).text("Show overload");
    } else {
      $( "#overload" ).text("Hide overload");
    }
    $('#container').toggleClass("overload");
  });
  $( "#thread" ).click(function() {
    if ($( "#container" ).hasClass( "thread" )) {
      $( "#thread" ).text("Show thread");
    } else {
      $( "#thread" ).text("Hide thread");
    }
    $('#container').toggleClass("thread");
  });

  var socket = io.connect();
  var container = $('#container');
  var cpuLoad = $('#cpuLoad');
  var memLoad = $('#memLoad');

  var nowDate = new Date().getTime();
  var lastMsgDate = 0;

  socket.on('load', function(data) {
    var cpuUsage = data.cpuUsage;
    var freeMem = data.freeMem;
    var totalMem = data.totalMem;

    if (cpuUsage) {
      //console.log((cpuUsage[0]*100).toFixed(1));
      cpuLoad.text((cpuUsage[0]*100).toFixed(1));
    }
    if (freeMem && totalMem) {
      //console.log((100*(totalMem-freeMem)/totalMem).toFixed(1));
      memLoad.text((100*(totalMem-freeMem)/totalMem).toFixed(1));
    }
  });

  socket.on('new-data', function(data) {
    var msg = data.value || data ;

    // if older, do nothing
    var msgDate = new Date(data.date);
    if (lastMsgDate >= msgDate.getTime()) {
      return;
    }
    // if new day, add a line
    if (new Date(lastMsgDate).getDate() != msgDate.getDate()) {
      var newItem = $('<div class="newDate">' + msgDate.toLocaleDateString() + '</div>');
      container.append(newItem);
    }

    lastMsgDate = msgDate.getTime();
    //console.log(msgDate.getTime());

    var txt = msg;

    // replace the < and >
    msg = msg.replace('>', '&gt;');
    msg = msg.replace('<', '&lt;');

    // get global type
    var classe = "info";
    if (msg.match(/: \[Rcon\] SERVER BACKUP STARTING. Server going readonly[.][.][.]/)) {
      classe="save";
    } else if (msg.match(/: Automatic saving is now disabled/)) {
      classe="save";
    } else if (msg.match(/: Saved the game/)) {
      classe="save";
    } else if (msg.match(/: Saved the world/)) {
      classe="save";
    } else if (msg.match(/: Automatic saving is now enabled/)) {
      classe="save";
    } else if (msg.match(/: \[Rcon\] SERVER BACKUP ENDED. Server going read-write[.][.][.]/)) {
      classe="save";
    } else if (msg.match(/: Can't keep up! Is the server overloaded?/)) {
      classe="overload";
    } else if (msg.match(/: .* moved too quickly!/)) {
      classe="overload";
    } else if (msg.match(/: Ambiguity between arguments/)) {
      classe="info";
    } else if (msg.match(/: Starting minecraft server/)) {
      classe="important";
    } else if (msg.match(/: .* joined the game$/)) {
      classe="important";
    } else if (msg.match(/: .* has made the advancement/)) {
      classe="important";
    } else if (msg.match(/: .* left the game$/)) {
      classe="important";
    } else if (msg.match(/: (&lt;|[\[]).*(&gt;|[\]])/)) {
      classe="important";
    } else if (msg.match(/: [^ ]* (was|burned|fell)/)) {
      classe="important";
    }

    // split line
    var splitRegexp = /^\[([0-9:]*)] \[([^\]]*)]: (.*)$/g;
    var match1 = splitRegexp.exec(msg);
    if (match1 != null) {

      txt = match1[3];
      var splitRegexp = /^(.*)( TextComponent{.*})$/g;
      var match2 = splitRegexp.exec(txt);
      if (match2 != null) {
        txt=match2[1]+"<span class='small'>"+match2[2]+"</span>";
      }

      msg="<span class='date'>"+match1[1]+"</span><span class='thread'>"+match1[2]+"</span><span class='msg'>"+txt+"</span>"
    } else {
      console.log("not match '"+msg+"'");
    }






    var newItem = $('<div class="'+classe+'">' + msg + '</div>');
    container.append(newItem);
    container.scrollTop(container.prop("scrollHeight"));


    if (document.hidden && (classe == "important") && (nowDate <= msgDate.getTime())) {
      // replace the < and >
      txt = txt.replace('&gt;', '>');
      txt = txt.replace('&lt;', '<');

      var options = {
        title: "Air craft logs",
        options: {
          body: txt,
          icon: "img/minecraft-logo.jpg",
          lang: 'en-US'
        }
      };
      //console.log(options);
      $("#easyNotify").easyNotify(options);
    }



  });
  socket.on('connect', function() {
    var msg = 'connected' ;
    var newItem = $('<div class="debug">' + msg + '</div>');
    container.append(newItem);
  });
  socket.on('error', function(data) {
    console.log(data);
    var msg = data || 'error' ;
    var newItem = $('<div class="debug">' + msg + '</div>');
    container.append(newItem);
  });
  socket.on('connect_failed', function(data) {
    var msg = data || 'connect_failed' ;
    var newItem = $('<div class="debug">' + msg + '</div>');
    container.append(newItem);
  });
});
