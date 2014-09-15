(function() {
  var Character, Drawable, Stroke,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Drawable = (function() {
    function Drawable() {}

    Drawable.prototype.draw = function() {};

    Drawable.prototype.animate = function() {};

    Drawable.prototype.getBounds = function() {};


    /* convenience methods for children */

    Drawable.prototype.getExtremes = function(numArray) {
      var max, mid, min;
      max = Math.max.apply(null, numArray);
      min = Math.min.apply(null, numArray);
      mid = (max + min) / 2;
      return [max, mid, min];
    };

    Drawable.prototype.getAllXs = function(points) {
      var point, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        point = points[_i];
        _results.push(point.x);
      }
      return _results;
    };

    Drawable.prototype.getAllYs = function(points) {
      var point, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = points.length; _i < _len; _i++) {
        point = points[_i];
        _results.push(point.y);
      }
      return _results;
    };

    return Drawable;

  })();

  Character = (function(_super) {
    __extends(Character, _super);

    function Character(pathStrings, options) {
      var pathString;
      this.options = options != null ? options : {};
      this.strokes = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = pathStrings.length; _i < _len; _i++) {
          pathString = pathStrings[_i];
          _results.push(new Stroke(pathString, this.options.strokeAttrs));
        }
        return _results;
      }).call(this);
    }

    Character.prototype.getBounds = function() {
      var maxX, maxY, midX, midY, minX, minY, strokeBoundingPoints, _ref, _ref1;
      strokeBoundingPoints = this.getAllStrokeBounds();
      _ref = this.getExtremes(this.getAllYs(strokeBoundingPoints)), maxY = _ref[0], midY = _ref[1], minY = _ref[2];
      _ref1 = this.getExtremes(this.getAllXs(strokeBoundingPoints)), maxX = _ref1[0], midX = _ref1[1], minX = _ref1[2];
      return [
        {
          x: minX,
          y: minY
        }, {
          x: maxX,
          y: maxY
        }
      ];
    };

    Character.prototype.getAllStrokeBounds = function() {
      var bounds, stroke, strokeBounds, _i, _len, _ref;
      bounds = [];
      _ref = this.strokes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stroke = _ref[_i];
        strokeBounds = stroke.getBounds();
        bounds.push(strokeBounds[0]);
        bounds.push(strokeBounds[1]);
      }
      return bounds;
    };

    Character.prototype.nestSvg = function(svg) {
      var bounds, scale, scaleX, scaleY;
      bounds = this.getBounds();
      scaleX = this.options.width / (bounds[1].x - bounds[0].x);
      scaleY = this.options.height / (bounds[1].y - bounds[0].y);
      scale = Math.min(scaleX, scaleY);
      return svg.group().move(-1 * bounds[0].x, -1 * bounds[0].y).transform({
        scaleX: scale,
        scaleY: scale
      });
    };

    Character.prototype.draw = function(svg) {
      var stroke, _i, _len, _ref, _results;
      _ref = this.strokes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stroke = _ref[_i];
        _results.push(stroke.draw(this.nestSvg(svg)));
      }
      return _results;
    };

    Character.prototype.animate = function(svg) {
      return this.animateStroke(this.nestSvg(svg), 0);
    };

    Character.prototype.animateStroke = function(svg, strokeNum) {
      var stroke;
      stroke = this.strokes[strokeNum];
      return stroke.animate(svg, (function(_this) {
        return function() {
          if (strokeNum < _this.strokes.length - 1) {
            return _this.animateStroke(svg, strokeNum + 1);
          }
        };
      })(this));
    };

    return Character;

  })(Drawable);

  Stroke = (function(_super) {
    __extends(Stroke, _super);

    Stroke.HORIZONTAL_STROKE = 1;

    Stroke.BACK_SLASH_STROKE = 2;

    Stroke.VERTICAL_STROKE = 3;

    Stroke.FORWARD_SLASH_STROKE = 4;

    Stroke.REVERSE_HORIZONTAL_STROKE = 5;

    Stroke.REVERSE_BACK_SLASH_STROKE = 6;

    Stroke.REVERSE_VERTICAL_STROKE = 7;

    Stroke.REVERSE_FORWARD_SLASH_STROKE = 8;

    function Stroke(zdtPathData, attrs) {
      var metadataString, pathString, pointString, _ref;
      this.attrs = attrs != null ? attrs : {};
      _ref = zdtPathData.split(':'), metadataString = _ref[0], pathString = _ref[1];
      pathString = pathString.replace(/;?\s*$/, '');
      this.points = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = pathString.split(';');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pointString = _ref1[_i];
          _results.push(this.parsePoint(pointString));
        }
        return _results;
      }).call(this);
      this.isComplete = metadataString[2] === 'P';
      this.strokeType = parseInt(metadataString[1]);
    }

    Stroke.prototype.getPathString = function() {
      var pathString, point, remainingPoints, start, _i, _len;
      start = this.points[0];
      remainingPoints = this.points.slice(1);
      pathString = "M " + start.x + " " + start.y;
      for (_i = 0, _len = remainingPoints.length; _i < _len; _i++) {
        point = remainingPoints[_i];
        pathString += " L " + point.x + " " + point.y;
      }
      pathString += " z";
      return pathString;
    };

    Stroke.prototype.parsePoint = function(pointString) {
      var pointArr;
      pointArr = pointString.split(',');
      return {
        x: pointArr[0],
        y: pointArr[1]
      };
    };

    Stroke.prototype.drawPath = function(svg) {
      return svg.path(this.getPathString(), this.attrs);
    };

    Stroke.prototype.getStrokeAnimationStartingPoint = function() {
      return this.getStrokeAnimationExtremePoint(this.strokeType, false);
    };

    Stroke.prototype.getStrokeAnimationEndingPoint = function() {
      return this.getStrokeAnimationExtremePoint(this.strokeType, true);
    };

    Stroke.prototype.getStrokeAnimationExtremePoint = function(strokeType, isReverse) {
      var extremeXs, extremeYs, maxIndex, midIndex, minIndex;
      extremeYs = this.getExtremes(this.getAllYs(this.points));
      extremeXs = this.getExtremes(this.getAllXs(this.points));
      if (strokeType > Stroke.FORWARD_SLASH_STROKE) {
        strokeType = strokeType - Stroke.FORWARD_SLASH_STROKE;
        isReverse = !isReverse;
      }
      minIndex = isReverse ? 0 : 2;
      maxIndex = isReverse ? 2 : 0;
      midIndex = 1;
      switch (strokeType) {
        case Stroke.HORIZONTAL_STROKE:
          return {
            x: extremeXs[minIndex],
            y: extremeYs[midIndex]
          };
        case Stroke.BACK_SLASH_STROKE:
          return {
            x: extremeXs[minIndex],
            y: extremeYs[minIndex]
          };
        case Stroke.VERTICAL_STROKE:
          return {
            x: extremeXs[midIndex],
            y: extremeYs[minIndex]
          };
        case Stroke.FORWARD_SLASH_STROKE:
          return {
            x: extremeXs[maxIndex],
            y: extremeYs[minIndex]
          };
      }
    };

    Stroke.prototype.getBounds = function() {
      var maxX, maxY, midX, midY, minX, minY, _ref, _ref1;
      _ref = this.getExtremes(this.getAllYs(this.points)), maxY = _ref[0], midY = _ref[1], minY = _ref[2];
      _ref1 = this.getExtremes(this.getAllXs(this.points)), maxX = _ref1[0], midX = _ref1[1], minX = _ref1[2];
      return [
        {
          x: minX,
          y: minY
        }, {
          x: maxX,
          y: maxY
        }
      ];
    };

    Stroke.prototype.getStrokeAnimationDistance = function() {
      var end, start;
      start = this.getStrokeAnimationStartingPoint();
      end = this.getStrokeAnimationEndingPoint();
      return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    };

    Stroke.prototype.draw = function(svg) {
      return this.drawPath(svg);
    };

    Stroke.prototype.animate = function(svg, onComplete) {
      var mask, start, stroke;
      if (onComplete == null) {
        onComplete = function() {};
      }
      start = this.getStrokeAnimationStartingPoint();
      mask = svg.circle(0).center(start.x, start.y);
      stroke = this.drawPath(svg).clipWith(mask);
      return mask.animate().radius(this.getStrokeAnimationDistance()).after(onComplete);
    };

    return Stroke;

  })(Drawable);

  window.HanziWriter = (function() {
    HanziWriter.prototype.options = {
      charDataLoader: function(char) {
        return hanziData[char];
      },
      width: null,
      height: null,
      strokeAttrs: {
        fill: '#EEE'
      }
    };

    function HanziWriter(element, character, options) {
      var key, value;
      if (options == null) {
        options = {};
      }
      this.svg = SVG(element);
      for (key in options) {
        value = options[key];
        this.options[key] = value;
      }
      this.setCharacter(character);
      this.character.animate(this.svg);
    }

    HanziWriter.prototype.setCharacter = function(char) {
      var pathStrings;
      pathStrings = this.options.charDataLoader(char);
      return this.character = new Character(pathStrings, this.options);
    };

    return HanziWriter;

  })();

}).call(this);
