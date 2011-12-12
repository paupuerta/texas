var EmptySeat, PlayingSeat, Seat;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Seat = (function() {

  function Seat(detail, game) {
    this.detail = detail;
    this.game = game;
    this.sn = this.detail.sn;
    this.init_dom();
    return;
  }

  Seat.prototype.init_dom = function() {
    this.dom = this.get_dom();
    this.set_position();
    return this.dom.data('sn', this.sn).appendTo($("#game"));
  };

  Seat.prototype.set_position = function(offset) {
    this.offset = offset != null ? offset : 0;
    this.dom.css(this.get_position());
  };

  return Seat;

})();

EmptySeat = (function() {

  __extends(EmptySeat, Seat);

  function EmptySeat() {
    EmptySeat.__super__.constructor.apply(this, arguments);
  }

  EmptySeat.prototype.get_dom = function() {
    return $("#game > .template > .empty_seat").clone(true);
  };

  EmptySeat.prototype.get_position = function() {
    console.log(this.detail);
    return $.positions.get_empty_position(this.detail.sn, this.offset);
  };

  return EmptySeat;

})();

PlayingSeat = (function() {

  __extends(PlayingSeat, Seat);

  function PlayingSeat() {
    PlayingSeat.__super__.constructor.apply(this, arguments);
  }

  PlayingSeat.prototype.get_dom = function() {
    return $("#game > .template > .playing_seat").clone(true);
  };

  PlayingSeat.prototype.get_position = function() {
    return $.positions.get_playing_position(this.detail.sn, this.offset);
  };

  return PlayingSeat;

})();

$(function() {
  $("#game .empty_seat").bind('click', function() {
    console.log($(this).data('sn'));
  });
});
