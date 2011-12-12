var Game;

Game = (function() {

  function Game(gid, dom) {
    this.gid = gid;
    this.dom = dom;
    return;
  }

  Game.prototype.init = function(detail) {
    this.detail = detail;
    this.seats = [];
    this.dom.trigger('inited');
  };

  Game.prototype.init_seat = function(seat_detail) {
    switch (seat_detail.state) {
      case PS_EMPTY:
        this.seats[seat_detail.sn] = new EmptySeat(seat_detail, this);
        break;
      default:
        this.seats[seat_detail.sn] = new PlayingSeat(seat_detail, this);
    }
  };

  return Game;

})();

$(function() {
  var game, game_dom;
  game = null;
  game_dom = $('#game');
  game_dom.bind('switch_game', function(event, args) {
    var cmd;
    game = new Game(args.gid, game_dom);
    cmd = {
      gid: args.gid
    };
    switch (args.action) {
      case 'watch':
        $.extend(cmd, {
          cmd: "WATCH"
        });
        break;
      case 'join':
        $.extend(cmd, {
          cmd: "JOIN",
          buyin: args.buyin,
          seat: 0
        });
        break;
      default:
        throw 'unknown game action';
    }
    $.ws.send($.pp.write(cmd));
    $(this).show();
    blockUI('#msg_joining');
    return $(this).oneTime('3s', function() {
      blockUI('#err_network');
    });
  });
  game_dom.bind('inited', function() {
    $(this).stopTime();
    unblockUI();
  });
  $.pp.reg("GAME_DETAIL", function(detail) {
    game.init(detail);
  });
  $.pp.reg("SEAT_DETAIL", function(detail) {
    game.init_seat(detail);
  });
  $.pp.reg("CANCEL", function(args) {});
});
