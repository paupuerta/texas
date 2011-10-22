$(document).ready(function() {
  // {{{ variable
  var watching = false, playing = false, 
      pot = 0, positions = null, seats_size = 0;
  var seats = [], private_card_index = 0, share_card_index = 0;
  var show_all = false; 
  var PS_EMPTY     = 0, 
      PS_PLAY      = 1,
      PS_FOLD      = 2,
      PS_WAIT_BB   = 4,
      PS_SIT_OUT   = 8,
      PS_MAKEUP_BB = 16,
      PS_ALL_IN    = 32,
      PS_BET       = 64,
      PS_RESERVED  = 128,
      PS_AUTOPLAY  = 256,
      PS_MUCK      = 512,
      PS_OUT       = 1024;

  var states = [];

  // }}}

  // {{{ generate function
  var is_me = null, check_game = null,       
      display_debug = null, send = null, 
      get_gid = null, get_seat = null, get_state = null,
      get_size = null, show_seats = null, get_seat_number = null;
  // }}}

  // {{{ initialization
  var initialization = function(args) { 
    // {{{ generate check me & game function
    is_me = function(o, is_callback, not_callback) {
      var pid = pickup_int(o, 'pid');

      if (is_callback == null && not_callback == null)
        return pid == args.pid;

      if (pid == args.pid)
        is_callback();
      else if (not_callback != undefined)
        not_callback();
    };

    check_game = function(o) {
      var gid = pickup_int(o, 'gid');
      if (gid != args.gid)
        throw 'not current game [' + o + ']';
    };

    get_gid = function() { return args.gid; };

    send = function(o) { 
      o.gid = args.gid;
      $.ws.send($.pp.write(o));
    };

    // generate display testing function
    display_debug = args.debug ? function() {
      //for (var i = 1; i < seats_size + 1; i ++) {
        //update_seat({inplay: 123456, sn: i, nick: '玩家昵称', pid: 1, state: PS_PLAY, betting: 0});
        //get_seat(i).children('.betting_label').css(positions[i].betting_label).text("1000").show();
        //get_seat(i).children('.card').css(positions[i].card).show();
      //}
    } : $.noop;
    // }}}

    regenrate_seat_function(args.seat);
    
    // generate game table DOM
    $("#game_table").setTemplateElement("game_table_template");
    $("#game_table").processTemplate({end: 9});
  }; 

  var regenrate_seat_function = function(seat) {
    display_states = (seat == undefined) ? refresh_states : $.noop;

    get_state = function(o) {
      if (seat == undefined && o == undefined)
        throw 'Can\'t call get_my_state before join game';

      var sn = o != undefined ? pickup_int(o, 'seat') : seat;

      if (states[sn] == undefined) {
        throw 'Not find seat state [' + o + ']';
      }

      return states[sn];
    }

    get_seat = function(o) {
      return $(get_state(o).dom);
    };

    get_seat_number = function(pid) {
      for(var i = 1; i < states.length; i++) {
        if ((states[i].pid == pid) && (states[i].state != PS_EMPTY))
          return states[i].seat;
      }

      throw 'Not our player id';
    };
  }

  var init_seats = function(size) {
    get_size = function() {
      return size;
    };

    var positions = get_positions(size);
    $(".game_seat, .empty_seat, .button, .card, .bet_label").hide();

    states = []; // init empty states;
    for (var i = 1; i < positions.length; i ++) {
      states[i] = {
        seat: i,
        dom: $("#game_seat_" + i).css(positions[i].outer),
        empty_dom: $("#empty_seat_" + i).css(positions[i].empty_outer),
        position: positions[i],
        photo: $.rl.img.def_face_0,
        bet: 0
      };
    }
  };

  var update_states = function(prop, val) {
    $.each(states, function(i, x) {
      if (i == 0)
        return;

      if (x.state != PS_EMPTY) {
        x[prop] = val;
      }
    });
    
  }
  var init_state = function(detail) {
    var st = update_state(detail);
    if (st.state != PS_EMPTY) {
      send({cmd: "PHOTO_QUERY", id: st.pid});
    }
  };

  var update_state = function(detail) {
    var st = get_state(detail);
    $.extend(st, detail);
    return st;
  }

  var refresh_state = function(state) {
    var x = get_state(state);
    var show = function() { $(this).show(); };

    if (x.state != PS_EMPTY) {
      $(x.empty_dom).hide().css(x.position.empty_outer);
      $(x.dom).animate(x.position.outer, 'slow', show);

      $(x.dom).
        children('.inplay').text(x.inplay).parent().
        children('.nick').text(x.nick).parent().
        children('.photo').attr('src', x.photo);

      if (x.state == PS_FOLD) {
        $(x.dom).addClass("ps_fold");
        is_me(x, function() {
          $(".private_card").addClass("ps_fold");
        }, function() {
          $(x.dom).children(".card").hide("slow");
        });
      } else {
        $(x.dom).removeClass("ps_fold");
        is_me(x, function() {
          $(".private_card").removeClass("ps_fold");
        });
      }
    } else {
      $(x.dom).hide().css(x.position.empty_outer);
      $(x.empty_dom).animate(x.position.empty_outer, 'slow', show);
    }
  }

  var refresh_states = function() {
    $.each(states, function(i, x) {
      if (i == 0)
        return;

      refresh_state(x);
    });
  };

  // }}}

  // game event {{{
  $('#game').bind('watching', function(event, args) {
    initialization(args);
    send({cmd: "WATCH"});
  });
http://localhost/~jack/texas/
  $('#game').bind('join', function(event, args) {
    initialization(args);
    send({cmd: "JOIN", seat: args.seat, buyin: 100});
  });

  $('#cmd_stand').click(function() {
  });

  $('#cmd_hall').click(function() {
  });

  $('#cmd_fold').click(function() {
    send({cmd: "FOLD"});
    $('#game_commands > *').attr("disabled", true);
  });

  $('#cmd_call, #cmd_check').click(function() {
    send({cmd: "RAISE", amount: 0});
    $('#game_commands > *').attr("disabled", true);
  });

  $('#cmd_raise').click(function() {
    amount = parseInt($('#raise_range').val());
    send({cmd: "RAISE", amount: amount});
    $('#game_commands > *').attr("disabled", true);
  });

  $('#raise_range').bind('change', function(event) {
    var v = parseInt($(this).val());
    var max = parseInt($(this).attr("max"));

    if (v == max)
      $('#cmd_raise').text("ALL-IN " + v);
    else 
      $('#cmd_raise').text("加注 " + v);
  });
  // }}}

  // seat & state  {{{
  var new_stage = function(have_blinds) {
    if (have_blinds)
      return;

    var bets = [];
    for(var i = 1; i < states.length; i++) {
      var t = $('.seat-bet-' + states[i].seat).map(function(n, x) {
        $(x).addClass("pot").removeClass("bet").removeClass("seat-bet-" + states[i].seat);
        return {bet: $(x), endpoint: random({left: 571, top: 227}, 20, 20)};
      });

      if (t.length != 0) {
        bets.push(t);
      }

      $(states[i].dom).children('.bet_label').hide();
    }

    if (bets.length != 0) {
      play_sound('move');

      $.each(bets, function(i, x) {
        move_bet(bets.shift());
      });
    }

    update_states('bet', 0);
  }

  // }}}
  
  // game protocol {{{
  // {{{ init detail protocol
  $.pp.reg("GAME_DETAIL", function(game) { 
    log(["game_detail", game]);

    check_game(game);
    init_seats(game.seats);
    display_debug();
  });

  $.pp.reg("SEAT_DETAIL", function(seat) {
    if (is_disable())
      return;

    check_game(seat);
    init_state(seat);

    if (get_size() == seat.seat) {
      // 如果初始化时制定了座位位置
      // 则此时调用为noop
      display_states();
    }
  });
  // }}}

  // {{{ player state notify 
  $.pp.reg("JOIN", function(notify) { 
    check_game(notify);
    notify.state = PS_FOLD;
    init_state(notify);

    is_me(notify, function() {
      regenrate_seat_function(notify.seat);
      var positions = trim_positions(notify.seat)

      for (var i = 1; i < positions.length; i++) {
        update_state({seat: i, position: positions[i]});
      };
    });

    console.log(states);
    refresh_states();
  });

  $.pp.reg("SEAT_STATE", function(state) { 
    if (is_disable())
      return;

    check_game(state);
    cancel_timer();
    update_state(state);
    refresh_state(state);
  });

  $.pp.reg("ACTOR", function(actor) { 
    log(["---actor---", actor.seat]);
    start_timer(actor.seat);
    is_me(get_state(actor.seat), function() {
      $('#game_commands > *').attr("disabled", false);
    }, function() {
      $('#game_commands > *').attr("disabled", true);
    });
  });

  $.pp.reg("BET_REQ", function(req) { 
    $('#raise_range').val(req.min).
      attr('min', req.min).
      attr('max', req.max);

    $("#cmd_raise").text('加注 ' + req.min);

    if (req.call == 0) {
      $("#cmd_check").attr("disabled", false);
      $("#cmd_call").attr("disabled", true);
    }
    else {
      $("#cmd_check").attr("disabled", true);
      $("#cmd_call").attr("disabled", false);
    }
      

    log(["---bet request---", req.call, req.max, req.min]);
  });

  $.pp.reg("RAISE", function(notify) { 
    var sum = notify.call + notify.raise;
    var state = get_state(get_seat_number(notify.pid));
    state.bet += sum;

    if (sum == 0) { // Player Check
      play_sound('check'); 
    } else {
      play_sound("bet");

      var bets = get_bets(sum);
      $.each(bets, function(i, x) {
        $('<img class="bet seat-bet-' + state.seat + '" />').
          attr("src", $.rl.img[x]).
          css(state.position.betting_ori).
          appendTo('#game_table').
          animate(random(state.position.betting, 7, 7), 450);
      });

      $(state.dom).
        children(".bet_label").
        css(state.position.betting_label).
        text(state.bet).
        show();
    }
  });

  $.pp.reg("PHOTO_INFO", function(player) { 
    if (is_disable())
      return;
    var photo = $.rl.img[player.photo]

    if (photo) {
      player.seat = get_seat_number(player.pid);
      player.photo = photo;
      update_state(player);
      refresh_state(player);
    }
  });
  // }}}

  // {{{ game state notify
  $.pp.reg("CANCEL", function(notify) { 
    log('---cancel game---');
    check_game(notify);
  });

  $.pp.reg("START", function(notify) { 
    log('---start game---');

    $(".card").hide("slow");
    $(".private_card").hide("slow");

    check_game(notify);
  });

  $.pp.reg("BUTTON", function(notify) { 
    log(['---notify button---', notify.seat]);

    notify.button = true;
    update_state(notify)
    $(get_state(notify).dom).children('.button').show();
  });

  $.pp.reg("SBLIND", function(notify) { 
    log(['---notify sb---', notify.seat]);

    notify.sb = true;
    update_state(notify)
  });

  $.pp.reg("BBLIND", function(notify) { 
    log(['---notify bb---', notify.seat]);

    notify.bb = true;
    update_state(notify)
  });

  $.pp.reg("STAGE", function(notify) { 
    log(['notify_stage', 'stage', notify.stage]);
    new_stage(notify.stage == 0);
  });

  $.pp.reg("END", function(notify) { 
    $(".game_seat").children(".button").hide("slow");
    $(".game_seat").children(".card").hide("slow");

    share_card_index = 0;
    private_card_index = 0;

    update_states('bet', 0);
    update_states('state', PS_FOLD);
    refresh_states();

    log(['----------------------notify_end----------------------']);
  });
  // }}}

  // {{{ card notify 
  $.pp.reg("PRIVATE", function(notify) { 
    log(['notify_private', 'pid', notify.pid, 'suit', notify.suit, 'face', notify.face]);

    play_sound('card');
    private_card_index += 1;
    $("#private_card_" + private_card_index).attr('src', get_poker(notify.face, notify.suit)).show('normal');
  });

  $.pp.reg("DRAW", function(notify) { 
    is_me(notify, $.noop, function() {
      play_sound('card');
      var state = get_state(get_seat_number(notify.pid));
      $(state.dom).children('.card').css(state.position.card).show();
    });
  });

  $.pp.reg("SHARE", function(notify) { 
    play_sound('card');
    share_card_index += 1;
    $("#share_card_" + share_card_index).
      attr('src', get_poker(notify.face, notify.suit)).
      show('slow');
  });

  $.pp.reg("SHOW", function(notify) { 
    // TODO
    log(['show', notify]);
  });
  // }}}

  // {{{ showdown notify
  $.pp.reg("HAND", function(notify) { 
    // TODO
    log(['hand', notify]);
  });

  $.pp.reg("WIN", function(notify) { 
    // TODO
    new_stage();
    share_pot([get_seat_number(notify.pid)]);
  });
  // }}}
  // }}}

  // utility {{{ 
  var share_pot = function(winners) {
    var winpots = [], cur = undefined;
    var all_size = $(".pot").length;
    var size = Math.floor(all_size / winners.length);

    $(".pot").each(function(i, x) {
      if (i % size == 0) {
        cur = (cur == undefined) ? 0 : (cur + 1);
        if (cur > winners.length - 1) {
          cur -= 1;
        }
      }

      if (winpots[cur] == undefined) {
        winpots[cur] = [];
      }

      var state = get_state(winners[cur]);

      winpots[cur].push({bet: $(this), endpoint: state.position.betting_ori});
    });

    play_sound('move');

    $.each(winpots, function(i, x) {
      move_bet(x, function(bet) { $(bet).remove(); });
    });
  };

  var get_poker = function(face, suit) {
    var a = new Number(face << 8 | suit);
    return $.rl.poker[a.toString()];
  };

  var is_disable = function() { 
    return $('#game').css('display') == 'none'; 
  };

  var play_sound = function(x) {
    if (x == 'move')
      console.log('play-sound', x);

    $.rl.sounds[x].play();
  }

  var get_bets = function(bet) {
    // generate bet animation
    var bets = [];
    var maxs = [
      {key: 100, val: "betting_1"},
      {key: 50, val: "betting_2"}, 
      {key: 20, val: "betting_3"}, 
      {key: 10, val: "betting_4"}, 
      {key: 5, val: "betting_5"}
    ];

    while (true) {
      var max = maxs.shift();
      var l = Math.floor(bet / max.key);
      for (var i = 1; i <= l; i++) {
        bets.push(max.val);
      }

      bet = bet % max.key;

      if (maxs.length == 0) {
        if (bet != 0)
          bets.push(max.val);

        break;
      }
    }

    return bets;
  };

  var random = function(ori, x, y) {
    var left = new Number(Math.floor((Math.random() * 100)) % x + ori.left);
    var top = new Number(Math.floor((Math.random() * 100)) % y + ori.top);
    
    return {left: left + "px", top: top + "px"};
  }

  var move_bet = function(bets, callback) {
    // [{bet: $(bet), :endpoint: {left: xxx, right: xxx}}]
    var time = 100;
    $.each(bets, function(i, x) {
      $(document).oneTime(time, function() {
        $(x.bet).animate(x.endpoint, 650, function() {
          if (callback != undefined)
            callback($(this));
        });
      });
      time += 20;
    });
  }

  var start_timer = function(seat) {
    var s = get_state(seat);
    $('<div class="timer" style="height: 120px;"><div /></div>').
      appendTo($(s.dom));

    var height = 120;
    var top = 0;

    $(".timer").everyTime(500, function(i) {
      height -= 4;
      top += 4;
      $(".timer").children("div").css('height', height + 'px').css('margin-top', top + 'px');
      if (height == 0) {
        cancel_timer();
      }
    }, 30);
  }

  var cancel_timer = function() {
    $(".timer").stopTime().remove();
  };

  var log = function(msg) {
    console.log(msg);
  };

  var fan = function(i) {
    if (i == 0)
      return i;
    else if (i > 0)
      return 0 - i;
    else
      return Math.abs(i);
  };

  var pickup_int = function(o, prop) {
    switch(typeof(o)) {
      case "string":
        return new Number(o);
      break;
      case "number":
        return o;
      break;
      case "object":
        return pickup_int(o[prop]);
      break;
      case "undefined":
        throw "pickup_int not care 'undefined', check your code";
      default:
        throw "pickup_int not care type, error [" + o + "]";
    }
  };

  // }}}

  // player & betting point {{{ 
  var trim_positions = function(offset) {
    var size = get_size();
    var positions = [];
    var target = get_positions(size);
    for (var i = 1, j = offset; i <= size; i++, j = j % size + 1) {
      positions[j] = target[i];
    }

    return positions;
  };

  var get_positions = function(size) {
    return size == 5 ? five_positions : nine_positions;
  }

  var convert_points = function(points) {
    return $.map(points, function(pos) {
      var c = pos.card.split(',');
      var o = pos.outer.split(',');
      var bb = pos.betting.split(',');
      var bl = pos.betting_label.split(',');

      return {
        outer: {left: o[0] + 'px', top: o[1] + 'px'},
        empty_outer: {left: o[2] + 'px', top: o[3] + 'px'},
        card : {left: c[0] + 'px', top: c[1] + 'px'},
        betting: { left: new Number(bb[2]), top: new Number(bb[3]) },
        betting_ori: { left: bb[0] + 'px', top: bb[1] + 'px' },
        betting_label: { left: bl[0] + 'px', top: bl[1] + 'px' } // 下注文字显示坐标
      };
    });
  };

  var five_positions = convert_points([
    {outer: "0,0", betting_label: "0,0", betting: "0,0,0,0", card: "0,0"},
    {outer: "435,350", betting_label: "90,-10", betting: "471,413,529,308", card: "90,30"},
    {outer: "233,350", betting_label: "65,-20", betting: "268,410,337,308", card: "90,28"},
    {outer: "117,230", betting_label: "105,5", betting: "150,288,231,203", card: "90,30"},
    {outer: "145,60", betting_label: "145,95", betting: "181,122,294,178", card: "90,40"},
    {outer: "342,20", betting_label: "50,125", betting: "376,83,389,168", card: "90,60"}
  ]);

  var nine_positions = convert_points([
    {outer: "0,0", betting_label: "0,0", betting: "0,0,0,0", card: "0,0"},
    {outer: "435,350,448,363", betting_label: "90,-10", betting: "471,413,535,314", card: "90,30"},
    {outer: "233,350,263,363", betting_label: "65,-20", betting: "268,410,309,303", card: "90,28"},
    {outer: "117,230,116,275", betting_label: "105,5", betting: "150,288,233,208", card: "90,30"},
    {outer: "145,60,173,95", betting_label: "145,95", betting: "181,122,300,175", card: "90,40"},
    {outer: "342,20,342,55", betting_label: "50,125", betting: "376,83,402,162", card: "90,60"},
    {outer: "565,20,559,55,", betting_label: "-5,125", betting: "604,84,572,162", card: "-52,60"},
    {outer: "766,60,741,95", betting_label: "-105,95", betting: "803,129,672,175", card: "-52,40"},
    {outer: "801,230,798,275", betting_label: "-63,5", betting: "832,290,749,208", card: "-51,30"},
    {outer: "680,350,640,363", betting_label: "20,-20", betting: "711,408,710,306", card: "-51,28"}
  ])
  // }}}
});
// vim: fdm=marker
