
var Blokus = (function() {
    
    var Blokus = {};
    
    // Simple filter implementation (all I need)
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback) {
            var res = [];
            for (var i = 0; i < this.length; i++) {
                if (callback(this[i])) {
                    res.push(this[i]);
                }
            }
            return res;
        };
    }
    
    // Simple vector class
    var Vec = function(x, y) {
        this.x = x;
        this.y = y;
    };
    Vec.prototype.clone = function() {
        return new Vec(this.x, this.y);
    };
    Vec.prototype.times = function(s) {
        return new Vec(this.x * s, this.y * s);
    };
    Vec.prototype.add = function(o) {
        return new Vec(this.x + o.x, this.y + o.y);
    };
    Vec.prototype.subtract = function(o) {
        return this.add(o.times(-1));
    };
    Vec.prototype.modulo = function(s) {
        return new Vec((this.x + s) % s, (this.y + s) % s);
    };
    Vec.prototype.toString = function() {
        return "("+this.x+","+this.y+")";
    };
    Vec.prototype.neighbours = function() {
        return [
            this.add(new Vec( 0, 1)),
            this.add(new Vec( 0,-1)),
            this.add(new Vec( 1, 0)),
            this.add(new Vec(-1, 0)),
        ].filter(function(v) {
            return v.x >= 0 && v.x < 20 && v.y >= 0 && v.y < 20;
        });
    };
    Vec.prototype.diagonals = function() {
        return [
            this.add(new Vec( 1, 1)),
            this.add(new Vec( 1,-1)),
            this.add(new Vec(-1, 1)),
            this.add(new Vec(-1,-1)),
        ].filter(function(v) {
            return v.x >= 0 && v.x < 20 && v.y >= 0 && v.y < 20;
        });
    };
    Vec.prototype.sqlength = function() {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    };
    Vec.prototype.length = function() {
        return Math.sqrt(this.sqlength());
    };
    Vec.prototype.equals = function(o) {
        return (this.x == o.x && this.y == o.y);
    };
    Vec.getrect = function(minx, miny, maxx, maxy) {
        var a = [];
        for (var x = minx; x <= maxx; x++) {
            for (var y = miny; y <= maxy; y++) {
                a.push(new Vec(x,y));
            }
        }
        return a;
    };
    
    var Game = Blokus.Game = function()
    {
        // Board
        this.board = new Board(this);
        
        // Players
        var tilenames = '12v3otzl4PXFWTUYZNVL5';
        this.players = [0, 1, 2, 3].map(function() {
            return {
                first_move: true,
                tiles: tilenames,
            };
        });
        
        /*
        // State
        this.mode = 'play'; // | history
        this.player = 0;
        $('#cpc').css('background-color', this.colors[this.player]);
        
        // Click events
        var self = this;
        $('.field', this.board.el).bind('click', function(e) {
            self.board.toggle_temporary($(e.target).data().pos);
        });
        $('a.play:first').bind('click', function(e) {
            if (tilename = self.board.commit(self.player, self.isfirst[self.player], self.tiles[self.player])) {
                self.isfirst[self.player] = false;
                self.tiles[self.player] = self.tiles[self.player].replace(tilename, '');
                self.player = (self.player + 1) % 4;
                $('#cpc').css('background-color', self.colors[self.player]);
                $('#msg').html('Allright, you placed a &quot;'+tilename+'&quot;! Player #'+(self.player+1)+', it\'s your turn!');
            } else {
                $('#msg').html('There was an error: <span style="color:#c00">'+self.board.errortext+'</span>');
            }
            return false;
        });
        $('a.clear:first').bind('click', function(e) {
            self.board.clear();
            return false;
        });
        */
    }
    Game.prototype.player = function(i) {
        return this.players[i];
    };
    /*
    BlokusGame.prototype.getActivePlayer = function() {
        return this.players[this.player];
    }
    BlokusGame.prototype.getActiveColor = function() {
        return this.colors[this.player];
    }
    
    */
    
    Blokus.blocknames = {
        // distances, sorted | dimensions | name
                            "|1.1" : "1",
                           "1|1.2" : "2",
                       "1.1.2|2.2" : "v",
                       "1.1.4|1.3" : "3",
                 "1.1.1.1.2.2|2.2" : "o",
                 "1.1.1.2.2.4|2.3" : "t",
                 "1.1.1.2.2.5|2.3" : "z",
                 "1.1.1.2.4.5|2.3" : "l",
                 "1.1.1.4.4.9|1.4" : "4",
         "1.1.1.1.1.2.2.2.4.5|2.3" : "P",
         "1.1.1.1.2.2.2.2.4.4|3.3" : "X",
         "1.1.1.1.2.2.2.4.5.5|3.3" : "F",
         "1.1.1.1.2.2.2.5.5.8|3.3" : "W",
         "1.1.1.1.2.2.4.4.5.5|3.3" : "T",
         "1.1.1.1.2.2.4.4.5.5|2.3" : "U",
         "1.1.1.1.2.2.4.4.5.9|2.4" : "Y",
         "1.1.1.1.2.2.4.5.5.8|3.3" : "Z",
        "1.1.1.1.2.2.4.5.5.10|2.4" : "N",
         "1.1.1.1.2.4.4.5.5.8|3.3" : "V",
        "1.1.1.1.2.4.4.5.9.10|2.4" : "L",
        "1.1.1.1.4.4.4.9.9.16|1.5" : "5",
    };
    var identify = Blokus.identify = function(vecs) {
        var uid;
        if (vecs.length == 1) {
            uid = "|1.1";
        } else {
            uid = [];
            var last = vecs[vecs.length - 1];
            //      min x | min y | max x | max y
            dims = [last.x, last.y, last.x, last.y];
            for (var i = 0; i < vecs.length - 1; i++) {
                for (var j = i + 1; j < vecs.length; j++) {
                    uid.push(vecs[i].subtract(vecs[j]).sqlength());
                }
                dims = [
                    Math.min(dims[0], vecs[i].x),
                    Math.min(dims[1], vecs[i].y),
                    Math.max(dims[2], vecs[i].x),
                    Math.max(dims[3], vecs[i].y),
                ];
            }
            uid = uid.sort(function(a,b) {
                if (a==b) return 0;
                return parseInt(a) > parseInt(b) ? 1 : -1;
            }).join(".");
            uid += "|" + [dims[2]-dims[0]+1, dims[3]-dims[1]+1].sort().join(".");
        }
        return this.blocknames[uid] || "unknown";
    };
    
    var Board = Blokus.Board = function(game)
    {
        this.game = game;
        
        this.initiated = false;
        this.board = $("<div>").addClass("board").appendTo("body").hide();
        
        this.table = [];
        for (var y = 0; y < 20; y++)
        {
            var row = [];
            for (var x = 0; x < 20; x++)
            {
                var field = $("<div>").addClass("field x-"+x+" y-"+y).data({
                    x: x,
                    y: y,
                    status: "empty",
                    player: -1, // 0, 1, 2 or 3 when permanent
                }).appendTo(this.board);
                row.push(field);
            }
            this.table.push(row);
        }
        
        $(window).resize(this.layout.bind(this)).resize();
        $(window).keydown(this.key.bind(this));
        
        this.colors = ["red", "blue", "yellow", "green"];
        
        this.state = "idle"; // idle|focus
        this.focus = new Vec(0, 0);
        this.temps = [];
        this.active = 0;
    };
    Board.prototype.layout = function() {
        /* The display area is 3 wide, 2 high, with a maximal viewport fit */
        var height = $(window).height(),
            width = $(window).width(),
            size = Math.min(width, height),
            maxpartsize = Math.min(height / 2, width / 3),
            maxboardsize = 2 * maxpartsize,
            spacing = Math.max(1, Math.floor(size / 300)),
            border = Math.max(1, Math.floor(size / 600)),
            room = maxboardsize - 21 * spacing,
            dim = Math.floor(room / 20),
            boardsize = 20 * dim + 21 * spacing,
            part = boardsize / 2,
            initial_offset = {
                top: Math.floor((height - 2 * part) / 2),
                left: Math.floor((width - 2 * part) / 2),
            },
            offset = {
                top: Math.floor((height - 2 * part) / 2),
                left: Math.floor((width - 3 * part) / 2),
            },
            css = function(x, y) {
                return {
                    top: y * dim + (y+1) * spacing,
                    left: x * dim + (x+1) * spacing,
                    height: dim - 2 * border,
                    width: dim - 2 * border,
                    "border-width": border,
                }
            },
            emsize = Math.floor($(window).height() / 45);
        this.table.map(function(row, y) {
            row.map(function(field, x) {
                field.css(css(x, y));
            });
        });
        $("body").css("font-size", emsize);
        if (this.initiated) {
            this.board.css(offset);
        } else {
            this.initiated = true;
            var self = this;
            setTimeout(function() {
                self.board.css(initial_offset).show("fade", 400, function() {
                    setTimeout(function() {
                        self.board.animate(offset, 400, "easeOutExpo");
                    }, 200);
                });
            }, 400);
        }
    };
    Board.prototype.key = function(e) {
        if (this.state == "idle" && e.which >= 37 && e.which <= 40) {
            this.get(this.focus).addClass("focus");
            this.state = "focus";
            return false;
        } else if (this.state == "focus" && e.which >= 37 && e.which <= 40) {
            this.get(this.focus).removeClass("focus");
            this.focus = this.focus.add([
                new Vec(-1, 0),
                new Vec( 0,-1),
                new Vec( 1, 0),
                new Vec( 0, 1),
            ][e.which - 37]).modulo(20);
            this.get(this.focus).addClass("focus");
            return false;
        } else if (this.state == "focus" && e.which == 27 && this.temps.length == 0) {
            this.get(this.focus).removeClass("focus");
            this.state = "idle";
            return false;
        } else if (this.state == "focus" && e.which == 27) {
            for (var i = 0; i < this.temps.length; i++) {
                this.get(this.temps[i]).removeClass("temp "+this.colors[this.active]);
            }
            this.temps = [];
            return false;
        } else if (this.state == "focus" && e.which == 32) {
            if (this.get(this.focus).hasClass("temp")) {
                var self = this;
                this.temps = this.temps.filter(function(v) {
                    return !v.equals(self.focus);
                });
            } else {
                this.temps.push(this.focus.clone());
            }
            this.get(this.focus).toggleClass("temp "+this.colors[this.active]);
            return false;
        } else if (this.state == "focus" && e.which == 13) {
            // ? freeze while checking validity
            if (this.valid()) {
                this.commit();
                this.active = (this.active + 1) % 4;
                $.flash("Okay! It's " + this.colors[this.active] + "'s turn now..");
            }
        }
    };
    Board.prototype.get = function(p) {
        return this.table[p.y][p.x];
    };
    Board.prototype.valid = function() {
        var self = this;
        
        // A move is valid iff all the conditions are satisfied:
        //   the move-fields count no less than 1 or more than 5    (1)
        //   all move-fields are connected                          (2)
        //   no move-field sides with a previous-field              (3)
        //   the player must posess the implied tile                (4)
        //   if first move then one move-field must be in corner
        //      and ignore (6), else ensure (6) satisfied           (5)
        //   at least one move-field diagonally touches a
        //      previous-field                                      (6)
        // ..where "previous-field" is a same-color no-move field
        
        // (1) -- The number of move-fields must be in range [1..5]
        if (this.temps.length < 1 || this.temps.length > 5) {
            $.flash("That's not a valid tile!", "error");
            return false;
        }
        
        // (2) -- All move fields must be connected
        var connected = this.temps.map(function(){return false;});
        connected[0] = true;
        var steps = connected.length - 1; // We musn't need more steps to reach all move-fields..
        var alltrue = function(c) { return c.length == 0 ? true : (c[0] && alltrue(c.slice(1))); }
        var fringe = [this.temps[0]];
        while (steps && !alltrue(connected)) {
            fringe.map(function(f) {
                f.neighbours().map(function(n) {
                    for (var i = 0; i < connected.length; i++) {
                        if (self.temps[i].equals(n)) {
                            fringe.push(self.temps[i]);
                            connected[i] = true;
                        }
                    }
                });
            });
            steps--;
        }
        if (!alltrue(connected)) {
            $.flash("You haven't connected the blocks!", "error");
            return false;
        }
        
        // (3) -- No move fields must side with already-on-the-board same-color fields
        try {
            this.temps.map(function(t) {
                t.neighbours().map(function(n) {
                    if (self.get(n).data("player") == self.active) {
                        throw "STOP";
                    }
                });
            });
        } catch(error) {
            $.flash("You cannot place your tile next to one of your previous tiles!", "error");
            return false;
        }
        
        // (4) -- Player must have the implied tile
        var tilename = Blokus.identify(this.temps);
        if (this.game.player(this.active).tiles.indexOf(tilename) < 0) {
            $.flash("You don't have this tile anymore!", "error");
            return false;
        }
        
        if (this.game.player(this.active).first_move) {
            // (5) -- if first move then (check if in corner) else (6)
            var corner = [new Vec(0, 0), new Vec(19, 0), new Vec(19, 19), new Vec(0, 19)] [this.active];
            if (this.temps.filter(function(t) {
                return t.equals(corner);
            }).length == 0) {
                $.flash("You should place your first tile of the game in your own corner!", "error");
                return false;
            }
            return true;
        } else {
            // (6) -- Must have diagonal same-color touch
            var diagonal_touch = false;
            try {
                this.temps.map(function(t) {
                    t.diagonals().map(function(d) {
                        if (d.data("player") == self.active) {
                            throw "FOUND";
                        }
                    });
                });
            } catch(found) {
                return true;
            }
            $.flash("You should place your tile diagonally touching one of your previous tiles!", "error");
            return false;
        }
    };
    Board.prototype.commit = function() {
        this.temps = [];
        this.game.player(this.active).first_move = false;
    }
    
    return Blokus;
    
})();

