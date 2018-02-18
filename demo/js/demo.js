var Application = /** @class */ (function () {
    function Application() {
        this.maxhits = 10;
        this.suggester = new EmptySuggester();
        this.search = document.getElementById('search_tag');
        this.headerCheckbox = document.getElementById('header_checkbox');
    }
    Application.prototype.draw = function () {
        var _this = this;
        var options = {
            renderer: {
                container: document.getElementById('container'),
                type: 'webgl'
            },
            settings: {
                defaultLabelColor: '#aaa',
                defaultLabelSize: 14,
                labelThreshold: 8,
                labelSize: "proportional",
                labelSizeRatio: 1.5,
                font: "Consolas",
                zoomMin: 0.01,
                zoomMax: 2,
                hideEdgesOnMove: true,
                maxNodeSize: 10,
                webglOversamplingRatio: 2
            }
        };
        sigma.parsers.json("demo/data.json", options, function (sigma) { return _this.onGraphRendered(sigma); });
    };
    Application.prototype.onGraphRendered = function (sigma) {
        var _this = this;
        this.sigma = sigma;
        var names = [];
        sigma.graph.nodes().forEach(function (node) { return names.push(node.id); });
        names.sort();
        this.suggester = new ListSuggester(names, this.maxhits);
        $(this.search).typeahead({ highlight: true }, {
            source: function (query, cb) {
                var matches = _this.suggester.suggest(query);
                cb(matches);
            },
            limit: this.maxhits
        });
        $(this.search).on("keypress", function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                _this.onSearch(_this.search.value);
            }
        });
        $(this.search).bind('typeahead:select', function () { return _this.onSearch(_this.search.value); });
        $(this.headerCheckbox).on("change", function (event) {
            var container = $("#container");
            if (_this.headerCheckbox.checked) {
                container.hide();
            }
            else {
                container.show();
            }
        });
    };
    Application.prototype.onSearch = function (tag) {
        var nodes = this.sigma.graph.nodes().filter(function (el) { return el.id === tag; });
        if (nodes.length === 0)
            return;
        var node = nodes[0];
        var ratio = Math.min(node.size, 20) / 400.0;
        this.sigma.camera.goTo({ x: node["read_cam0:x"], y: node["read_cam0:y"], ratio: ratio });
    };
    return Application;
}());
var EmptySuggester = /** @class */ (function () {
    function EmptySuggester() {
    }
    EmptySuggester.prototype.suggest = function (prefix) {
        return [];
    };
    return EmptySuggester;
}());
var InputMatch;
(function (InputMatch) {
    InputMatch[InputMatch["LT"] = 0] = "LT";
    InputMatch[InputMatch["GT"] = 1] = "GT";
    InputMatch[InputMatch["EQ"] = 2] = "EQ";
    InputMatch[InputMatch["SUBSTRING"] = 3] = "SUBSTRING";
    InputMatch[InputMatch["SUPERSTRING"] = 4] = "SUPERSTRING";
})(InputMatch || (InputMatch = {}));
var ListSuggester = /** @class */ (function () {
    function ListSuggester(data, hits) {
        this.data = data;
        this.cached = new Array(data.length);
        this.hits = hits;
    }
    ListSuggester.prototype.suggest = function (prefix) {
        var query = this.normalize(prefix);
        if (!query)
            return [];
        var idx = this.search(query);
        if (idx === -1)
            return [];
        return this.collect(query, idx);
    };
    ListSuggester.prototype.collect = function (input, startIdx) {
        var res = [];
        var i = startIdx;
        while (i < this.data.length && res.length < this.hits) {
            var im = this.matches(input, i);
            if (im === InputMatch.EQ || im === InputMatch.SUBSTRING) {
                res.push(this.data[i]);
            }
            else {
                break;
            }
            i++;
        }
        return res;
    };
    ListSuggester.prototype.normalize = function (input) {
        return input.toLowerCase().trim();
    };
    ListSuggester.prototype.at = function (idx) {
        var res = this.cached[idx];
        if (!res) {
            res = this.normalize(this.data[idx]);
            this.cached[idx] = res;
        }
        return res;
    };
    ListSuggester.prototype.matches = function (input, idx) {
        var target = this.at(idx);
        return this.compare(input, target);
    };
    ListSuggester.prototype.compare = function (input, target) {
        var inputSize = input.length;
        var targetSize = target.length;
        for (var i = 0; i < Math.min(inputSize, targetSize); ++i) {
            var c1 = input[i];
            var c2 = target[i];
            if (c1 !== c2) {
                if (c1 < c2)
                    return InputMatch.LT;
                else
                    return InputMatch.GT;
            }
        }
        if (inputSize === targetSize)
            return InputMatch.EQ;
        if (inputSize < targetSize)
            return InputMatch.SUBSTRING;
        return InputMatch.SUPERSTRING;
    };
    ListSuggester.prototype.search = function (input) {
        var m = 0;
        var n = this.data.length - 1;
        var lastMatch = -1;
        var lastSuperString = -1;
        while (m <= n) {
            var k = (n + m) >> 1;
            var cmp = this.matches(input, k);
            switch (cmp) {
                case InputMatch.GT:
                    m = k + 1;
                    break;
                case InputMatch.LT:
                    n = k - 1;
                    break;
                case InputMatch.SUBSTRING:
                    lastMatch = k;
                    n = k - 1;
                    break;
                case InputMatch.SUPERSTRING:
                    lastSuperString = k;
                    m = k + 1;
                    break;
                case InputMatch.EQ: return k;
            }
        }
        if (lastMatch !== -1)
            return lastMatch;
        return -1;
    };
    return ListSuggester;
}());
new Application().draw();
