
var Blokus = (function() {
    
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
    if (!Array.prototype.flatten) {
        Array.prototype.flatten = function() {
            return this.reduce(function(flat, section) {
                return flat.concat(section);
            });
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
    Vec.serialize = function(arr) {
        return arr.map(function(v) {
            return v.toString();
        }).join(", ");
    };
    Vec.unserialize = function(str) {
        var numbers = str.match(/[0-9\-]+/g);
        if (!numbers) {
            return [];
        }
        vecs = [];
        for (var i = 0, len = numbers.length / 2; i < len; i++) {
            vecs.push(new Vec(parseInt(numbers[i*2]), parseInt(numbers[i*2 + 1])));
        }
        return vecs;
    };
    
    var tiles = (function() {
        var adjustments = {
                "N": new Vec( 0,-1),
                "E": new Vec( 1, 0),
                "S": new Vec( 0, 1),
                "W": new Vec(-1, 0),
            },
            tiles = {},
            blueprints = [
                ["1", ""],
                ["2", "E"],
                ["v", "ES"],
                ["3", "EE"],
                ["o", "ESW"],
                ["t", "EEWS"],
                ["z", "ESE"],
                ["l", "EES"],
                ["4", "EEE"],
                ["P", "EESW"],
                ["X", "EEWNSS", new Vec(0, 1)],
                ["F", "ESSNE"],
                ["W", "ESES"],
                ["T", "EEWSS"],
                ["U", "SEEN"],
                ["Y", "EEEWS"],
                ["Z", "ESSE"],
                ["N", "EESE"],
                ["V", "EESS"],
                ["L", "EEES"],
                ["5", "EEEE"],
            ],
            analyze = function(vs) {
                var sqlengths = [],
                    first = vs[0];
                //      min x  | min y  | max x  | max y
                dims = [first.x, first.y, first.x, first.y];
                vs.map(function(v, i) {
                    vs.map(function(w, j) {
                        if (i < j) {
                            sqlengths.push(v.subtract(w).sqlength());
                        }
                    });
                    dims = [
                        Math.min(dims[0], v.x),
                        Math.min(dims[1], v.y),
                        Math.max(dims[2], v.x),
                        Math.max(dims[3], v.y),
                    ];
                });
                var uid = sqlengths.sort().join("."),
                    dimensions = [dims[2]-dims[0]+1, dims[3]-dims[1]+1].sort();
                uid += "|" + dimensions.join(".");
                return window.z = {
                    vecs: vs,
                    sqlengths: sqlengths,
                    dimensions: dimensions,
                    uid: uid,
                };
            };
        tiles.names = blueprints.map(function(t) {
            return t[0];
        }).join("");
        tiles.data = blueprints.reduce(function(data, t) {
            var vecs = t[1].split("").reduce(function(vecs, adj) {
                vecs.unshift(vecs[0].add(adjustments[adj]));
                return vecs;
            }, [t[2] || new Vec(0, 0)]).reduce(function(unique, v) {
                if (unique[v.toString()] == undefined) {
                    unique.push(v);
                    unique[v.toString()] = true;
                }
                return unique;
            }, []);
            data[t[0]] = analyze(vecs);
            return data;
        }, {});
        tiles.lookup = blueprints.reduce(function(lookup, t) {
            lookup[tiles.data[t[0]].uid] = t[0];
            return lookup;
        }, {});
        tiles.identify = function(vecs) {
            var res = analyze(vecs);
            return res ? tiles.lookup[res.uid] : false;
        };
        return tiles;
    })();
    window.t = tiles;
        /*
    var lookup = {
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
    */
    
    var Blokus = function()
    {
        var self = this;
        
        /*
            Game & (UI) state
        */
        this.active = 0;
        this.uistate = "idle"; // idle|focus
        
        this.temps = {
            // Private
            _vecs: [], // _vecs[(new Vec(x, y)).toString()] == z => _vecs[z].equals(new Vec(x, y))
            _tilename: null,
            _update: function() {
                this.all = this._vecs.map(function(v) {
                    return v.clone();
                });
                
                // The temporary stones by themselves are a valid tile iff all conditions apply:
                // * 1 <= NUM <= 5
                // * all stones connected
                if (this._vecs.length < 1 || this._vecs.length > 5) {
                    this._valid = false;
                    return;
                }
                
                var todo = this._vecs.slice(1).reduce(function(todo, v) {
                    todo[v.toString()] = true;
                    return todo;
                }, {});
                todo.num = this._vecs.length - 1;
                var fringe = [this._vecs[0]];
                while (fringe.length > 0 && todo.num > 0)
                {
                    fringe = fringe.map(function(f) {
                        return f.neighbours();
                    }).flatten().filter(function(v) {
                        if (todo[v]) {
                            delete todo[v];
                            todo.num--;
                            return true;
                        } else {
                            return false;
                        }
                    });
                }
                if (todo.num > 0) {
                    this._valid = false;
                    return;
                }
                
                this._valid = true;
                this._tilename = tiles.identify(this._vecs);
            },
            // Public
            all: [],
            add: function(v) {
                var str = v.toString();
                if (!this._vecs[str]) {
                    this._vecs[str] = this._vecs.push(v) - 1;
                    this._update();
                }
            },
            remove: function(v) {
                var str = v.toString();
                if (this._vecs[str] != undefined) {
                    if (this._vecs[str] == this._vecs.length - 1) {
                        this._vecs.pop();
                        delete this._vecs[str];
                    } else {
                        this._vecs[this._vecs[str]] = this._vecs[this._vecs.length - 1];
                        this._vecs[this._vecs.pop().toString()] = this._vecs[str];
                        delete this._vecs[str];
                    }
                    this._update();
                }
            },
            contains: function(v) {
                return this._vecs[v.toString()] != undefined;
            },
            empty: function() {
                return this._vecs.length == 0;
            },
            valid: function() {
                return this._valid;
            },
            tilename: function() {
                return this._valid ? this._tilename : false;
            },
            reset: function() {
                this._vecs = [];
                this._update();
            },
            report: function() {
                return this._valid ? "valid: " + this._tilename : "invalid";
            },
        };
        
        this.players = {
            // Private
            _i: -1,
            _data: ["red", "blue", "yellow", "green"].map(function(color, k) {
                return {
                    index: k,
                    first_move: true,
                    tiles: tiles.names,
                    color: color,
                    corner: new Vec(k % 3 == 0 ? 0 : 19, k < 2 ? 0 : 19),
                    focus: new Vec(k % 3 == 0 ? 0 : 19, k < 2 ? 0 : 19),
                };
            }),
            // Public
            active: null,
            rotate: function() {
                this._i = (this._i + 1) % this._data.length;
                this.active = this._data[this._i];
                return this;
            },
        }.rotate();
        
        /*
            HTML setup
        */
        this.initiated = false;
        this.board = $("<div>").addClass("board").appendTo("body").hide();
        
        this.table = [];
        for (var y = 0; y < 20; y++)
        {
            var row = [];
            for (var x = 0; x < 20; x++)
            {
                row.push($("<div>").addClass("field x-"+x+" y-"+y).data({
                    pos: new Vec(x, y),
                    permanent: false,
                    player: null, // when permanent
                }).appendTo(this.board));
            }
            this.table.push(row);
        }
        
        this.tilestore = $("<div>").addClass("tilestore").appendTo("body");
        tiles.names.split("").map(function(tilename) {
            var tile = $("<div>").addClass("tile tile-"+tilename).appendTo(self.tilestore),
                width = 0,
                height = 0,
                dim = 0.8;
            tiles.data[tilename].blocks = tiles.data[tilename].vecs.map(function(v) {
                width = Math.max(width, v.x + 1);
                height = Math.max(height, v.y + 1);
                return $("<div>").addClass("block").appendTo(tile).css({
                    top: (v.y * dim) + "em",
                    left: (v.x * dim) + "em",
                });
            });
            tiles.data[tilename].el = tile.css({
                width: (width * dim) + "em",
                height: (height * dim) + "em",
            });
        });
        
        /*
            Event handling
        */
        $(window).resize(this.layout.bind(this)).resize();
        $(window).keydown(this.key.bind(this));
        $(".field").click(function() {
            if (!$(this).data("permanent")) {
                if (self.uistate == "focus") {
                    self.get(self.players.active.focus).removeClass("focus");
                } else {
                    self.uistate = "focus";
                }
                self.players.active.focus = $(this).data("pos").clone();
                self.get(self.players.active.focus).addClass("focus");
                self.toggletemp();
            }
        });
    };
    Blokus.prototype.layout = function() {
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
            tilestorecss = {
                top: offset.top + Math.floor(0.25 * dim),
                left: offset.left + Math.floor(2 * part) + Math.floor(0.25 * dim),
                width: Math.floor(part) - Math.floor(0.5 * dim),
                height: Math.floor(2 * part) - Math.floor(0.5 * dim),
            },
            emsize = dim;
        this.table.map(function(row, y) {
            row.map(function(field, x) {
                field.css(css(x, y));
            });
        });
        $("body").css("font-size", emsize);
        if (this.initiated) {
            this.board.css(offset);
            this.tilestore.css(tilestorecss);
        } else {
            this.initiated = true;
            var self = this;
            setTimeout(function() {
                self.board.css(initial_offset).show("fade", 400, function() {
                    setTimeout(function() {
                        self.board.animate(offset, 400, "easeOutExpo", function() {
                            self.tilestore.css(tilestorecss);
                            self.display_temp_tiles();
                        });
                    }, 200);
                });
            }, 400);
        }
    };
    Blokus.prototype.display_temp_tiles = function() {
        var self = this;
        $(".tile").hide().find(".block").removeClass("red green yellow blue")
            .addClass(this.players.active.color);
        this.players.active.tiles.split("").map(function(tilename) {
            tiles.data[tilename].el.show();
        });
        this.tilestore.show("fade", 300);
    };
    Blokus.prototype.key = function(e) {
        var self = this;
        if (this.uistate == "idle" && e.which >= 37 && e.which <= 40) {
            this.get(this.players.active.focus).addClass("focus");
            this.uistate = "focus";
        } else if (this.uistate == "focus" && e.which >= 37 && e.which <= 40) {
            this.get(this.players.active.focus).removeClass("focus");
            this.players.active.focus = this.players.active.focus.add([
                new Vec(-1, 0),
                new Vec( 0,-1),
                new Vec( 1, 0),
                new Vec( 0, 1),
            ][e.which - 37]).modulo(20);
            this.get(this.players.active.focus).addClass("focus");
        } else if (this.uistate == "focus" && e.which == 27 && this.temps.empty()) {
            this.get(this.players.active.focus).removeClass("focus");
            this.uistate = "idle";
        } else if (this.uistate == "focus" && e.which == 27) {
            this.temps.all.map(function(v) {
                self.get(v).removeClass("temp").removeClass(self.players.active.color);
            });
            this.temps.reset();
        } else if (this.uistate == "focus" && e.which == 32) {
            this.toggletemp();
        } else if (this.uistate == "focus" && e.which == 13) {
            // ? freeze while checking validity
            if (this.valid()) {
                this.get(this.players.active.focus).removeClass("focus");
                $(".tile-" + this.temps.tilename()).hide("puff", 300, function() {
                    setTimeout(function() {
                        self.tilestore.hide("fade", 600, function() {
                            self.commit();
                            self.get(self.players.active.focus).addClass("focus");
                            self.display_temp_tiles();
                            $.flash("Okay! It's " + self.players.active.color + "'s turn now..");
                        });
                    }, 500);
                });
            }
        } else {
            return true;
        }
        
        return false;
    };
    Blokus.prototype.toggletemp = function() {
        var f = this.get(this.players.active.focus);
        if (!f.data("permanent")) {
            if (f.hasClass("temp")) {
                this.temps.remove(this.players.active.focus);
            } else {
                this.temps.add(this.players.active.focus.clone());
            }
            f.toggleClass("temp " + this.players.active.color);
        }
    };
    Blokus.prototype.get = function(p) {
        return this.table[p.y][p.x];
    };
    Blokus.prototype.valid = function() {
        var self = this;
        
        // A move is valid iff all the conditions are satisfied:
        //   the temporary fields must form a valid tile            (1)
        //   the fields must not overlap with existing tiles        (2)
        //   no move-field sides with a previous-field              (3)
        //   the player must posess the implied tile                (4)
        //   if first move then one move-field must be in corner
        //      and ignore (6), else ensure (6) satisfied           (5)
        //   at least one move-field diagonally touches a
        //      previous-field                                      (6)
        // ..where "previous-field" is a same-color no-move field
        
        // (1) -- The temporary fields must form a valid tile
        if (!this.temps.valid()) {
            $.flash("That's not a valid tile!", "error");
            return false;
        }
        
        // (2) -- The fields must not overlap with existing tiles
        if (this.temps.all.filter(function(t) {
            return self.get(t).data("permanent");
        }).length > 0) {
            $.flash("Overlap!", "error");
            return false;
        }
        
        // (3) -- No move fields must side with already-on-the-board same-color fields
        try {
            this.temps.all.map(function(t) {
                t.neighbours().map(function(n) {
                    if (self.get(n).data("player") == self.players.active) {
                        throw "STOP";
                    }
                });
            });
        } catch(error) {
            $.flash("You cannot place your tile next to one of your previous tiles!", "error");
            return false;
        }
        
        // (4) -- Player must have the implied tile
        if (this.players.active.tiles.indexOf(this.temps.tilename()) < 0) {
            $.flash("You don't have this tile anymore!", "error");
            return false;
        }
        
        if (this.players.active.first_move) {
            // (5) -- if first move then (check if in corner) else (6)
            if (!this.temps.contains(this.players.active.corner)) {
            $.flash("That's not a valid tile!", "error");
                $.flash("You should place your first tile of the game in your own corner ("+this.players.active.corner.toString()+")!", "error");
                return false;
            }
            return true;
        } else {
            // (6) -- Must have diagonal same-color touch
            var diagonal_touch = false;
            try {
                this.temps.all.map(function(t) {
                    t.diagonals().map(function(d) {
                        if (self.get(d).data("player") == self.players.active) {
                            throw "FOUND";
                        }
                    });
                });
            } catch(found) {
                if (found == "FOUND") {
                    return true;
                }
            }
            
            $.flash("You should place your tile diagonally touching one of your previous tiles!", "error");
            return false;
        }
    };
    Blokus.prototype.commit = function() {
        var self = this;
        var tilename = this.temps.tilename();
        
        // commit temporary tiles
        this.temps.all.map(function(pos) {
            var f = self.get(pos);
            f.data("permanent", true);
            f.data("player", self.players.active);
            f.removeClass("temp");
        });
        this.temps.reset();
        
        // update player state and rotate active player
        this.players.active.tiles = this.players.active.tiles.replace(new RegExp(tilename), "");
        this.players.active.first_move = false;
        this.players.rotate();
    }
    
    return Blokus;
    
})();

