var ERR_NETWORK = {message: '<h3 id=err_network>抱歉，網絡連線錯誤，請稍後再試。</h3>', id: '#err_network', generate: false};
var STA_CONNECT = {message: '<h3 id=sta_connect>連線種连接中...</h3>', id: '#sta_connect', generate: true};
var STA_LOADING = {message: '<h3 id=sta_loading>加載中...</h3>', id: '#sta_loading', generate: true};
var STA_SINGIN = {message: '<h3 id=sta_singin>登陸中...</h3>', id: '#sta_singin', generate: true};

$(function() {
  $.ajaxSetup ({
    cache: false //关闭缓存
  });

  var input_usr, input_pwd, pong, dot, player;

  // block user interface {{{
  var blockUI = function(obj) {
    dot = 1;
    $(document).stopTime();
    $.blockUI(obj);

    if (obj.generate == true) {
      $(document).everyTime(250, obj.id, function() {
        var lab = $(obj.id);
        var n = lab.text().replace(/[\.]{1,}/, new Array(++dot).join('.'));
        dot = dot >= 6 ? 1 : dot;
        lab.text(n);
      });
    }
  } 
  // }}}

  var loading = function() { // {{{
    blockUI(STA_LOADING);

    var resources = [{ 
      url: 'singin.html', 
      callback: function(h) {
        $('#singin').html(h);
      }
    }, {
      url: 'hall.html', 
      callback: function(h) {
        $('#hall').html(h);
        $.rl.load([{ url: 'js/hall.js' }]);
      }
    }, {
      url: 'game.html', 
      callback: function(h) {
        $('#game').html(h);
        $.rl.load([{ url: 'js/game.js' }]);
      }
    }, {
      url: 'css/heads.png', 
      callback: function(img) {
        for (var i = 0; i < img.width / 80; i++) {
          $.rl.img['def_face_' + i] = 
            $.rl.getImgDataUrl(img, i * 80, 0, 80, 80);
        }
      }
    }, {
      url: 'css/poker.png', 
      callback: function(img) {
        //$.rl.poker = [undefined];
        var swp = [1,4,3,2]
        for (var j = 0; j < img.height / 65; j ++) {
          for (var i = 0; i < img.width / 45; i++) {
            var key = new Number(i + 1 << 8 | swp[j]);
            $.rl.poker[key.toString()] = 
              $.rl.getImgDataUrl(img, i * 45, j * 65, 45, 65);
          }
        }
      }
    }, {
      url: 'css/betting.png', 
      callback: function(img) {
        for (var i = 0; i < img.width / 138; i++) {
          $.rl.img["betting_" + (i + 1)] = 
            $.rl.getImgDataUrl(img, i * 138, 0, 138, 145);
        }
      }
    }];

    var autoSingin = function() { // {{{

      var singin = function() {
        blockUI(STA_SINGIN);
        var cmd = {cmd: "LOGIN", usr: input_usr, pass: input_pwd};
        $.ws.send($.pp.write(cmd));
      }

      input_usr = $.url.get("usr");
      input_usr = input_usr == null ? 
        localStorage.getItem("save_usr") : input_usr;

      input_pwd = $.url.get("pwd"); 
      input_pwd = input_pwd == null ? 
        localStorage.getItem("save_pwd") : input_pwd;

      $('#txt_usr').val(input_usr);

      $("#singin").bind("submit", function() {
        input_usr = $('#txt_usr').val();
        input_pwd = $('#txt_pwd').val();
        singin();
        return false;
      });

      if (!$.isEmpty(input_usr) && !$.isEmpty(input_pwd)) {
        singin();
      } else {
        blockUI({message: $("#singin"), id: '#singin', generate: false});
      }
    } // }}}

    // 加载后回调进行自动登陆
    // 如果不能自动登陆则启动手动登陆
    $.rl.load(resources, autoSingin);
    $.each(
      ["bet", "raise", "move", "card", "check", "fold", "turn"], 
      function(i, x) {
        $.rl.sounds[x] = new Audio("css/sound/" + x + ".mp3");
      }
    );
  } // }}}

  var onConnection = function() {
    $(document).oneTime(1000, function() {
      loading();
    });

    $('#pong').everyTime('2s', function() {
      $.ws.send($.pp.write({cmd: "PING"}));
    });
  }

  var singinFinish = function() {
    $(document).stopTime();
    $("#singin").hide();
    $.unblockUI();
    $("#hall").show('slow').trigger('setup').trigger('active', 0);
  }

  var saveAccountInfo = function(pid) {
    if ($("#ckb_save").attr('checked')) {
      localStorage.setItem("save_usr", input_usr);
    }

    $(document).data("pid", pid);
  }

  // PROTOTYPE REGISTER {{{
  $.pp.reg("ERROR", function(obj) {
    console.log("ERROR - " + $.pp.err(obj.command));
    blockUI({message: $("#singin"), id: '#singin', generate: false});

    $("#txt_pwd").val("");
    $("#lab_err_singin").show();
  });

  $.pp.reg("LOGIN", function(you) {
    pid = you.id;
    $.ws.send($.pp.write({cmd: "PLAYER_QUERY", id: pid}));

    saveAccountInfo(pid);
    singinFinish();
  });

  $.pp.reg("PONG", function(obj) {
  });

  $.pp.reg("PLAYER_INFO", function(player) {
    if (player.photo.indexOf('def_face_') == 0)
      $("#photo").attr('src', $.rl.img[player.photo]);
    else if (player.photo.indexOf('base64'))
      $("#photo").attr('src', player.photo);
    else 
      $("#photo").attr('src', $.rl.img.def_face_0);

    $("#nick").text("昵稱: " + player.nick);
    $("#usr").show();
  });

  // }}}
  
  $('#toolbar').bind("setup", function() {
    $.ws.send($.pp.write({cmd: "PLAYER_QUERY", id: pid}));
  });

  $("#settings").bind('click', function() {
  });

  $("#helps").bind('click', function() {
  });

  $('#page').oneTime('5s', function() {
    if ($.ws.isConnection() == false) {
      blockUI(ERR_NETWORK);
    }
  });

  // 初始化websocket并通过建立连接
  // 引发系列的事件与协议的通讯
  blockUI(STA_CONNECT);
  $.ws.defaults.onmessage = $.pp.onmessage;
  $.ws.defaults.onopen = onConnection;

  if ($.url.get("host") != undefined) {
    $.ws.defaults.host = $.url.get("host");
  }

  $.ws.init();
});
// vim: fdm=marker
