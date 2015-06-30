var mousePos = view.center + [view.bounds.width / 3, 100];
var position = view.center;
var lastAngle = 180;
var frames = 0;
var earthFrames = 0;
var score = 0;

var txt = new PointText(new Point(200, 50));
txt.content = "Score: 0";
txt.fillColor = "white";
txt.fontSize = "1em";

// var handImg = new Raster('hand');
// handImg.position = view.center;

function onResize(event) {
    // Whenever the window is resized, recenter the path:
    // path.position = view.center;
    // handImg.position = view.center;
}

function onFrame(event) {
    position += (mousePos - position) / 10;
    var vector = (view.center - position) / 10;
    moveStars(vector * 3);
    moveRainbow(vector, event);
    // earthImg.bringToFront();
    frames++;
    earthFrames++;
    if(frames > 60){
        frames = 0;
        if( whap.visible ){
            whap.visible = false;            
            score = score + 1;
            txt.content = "Score: " + score;
        }
    }
    if(earthFrames > 180){
        earthFrames = 0;
        if (!earthImg.visible){
            earthImg.visible = true;
        }
    }
    txt.position = new Point(200,50);
}

function onMouseMove(event) {
    mousePos = event.point;
}

function onKeyDown(event) {
}

function keepInView(item) {
    var position = item.position;
    var viewBounds = view.bounds;
    if (position.isInside(viewBounds))
        return;
    var itemBounds = item.bounds;
    if (position.x > viewBounds.width + 5) {
        position.x = -item.bounds.width;
    }

    if (position.x < -itemBounds.width - 5) {
        position.x = viewBounds.width;
    }

    if (position.y > viewBounds.height + 5) {
        position.y = -itemBounds.height;
    }

    if (position.y < -itemBounds.height - 5) {
        position.y = viewBounds.height
    }
}

var earthImg = new Raster('earth');
var moveStars = new function() {
    earthImg.data = {
        vector: new Point({
            angle: Math.random() * 360,
            length : 1 * Math.random() / 5
        })
    };
    
    // The amount of symbol we want to place;
    var count = 100;

    // Create a symbol, which we will use to place instances of later:
    var path = new Path.Circle({
        center: new Point(0, 0),
        radius: 5,
        fillColor: 'white',
        strokeColor: 'black'
    });


    var symbol = new Symbol(path);

    // Place the instances of the symbol:
    for (var i = 0; i < count; i++) {
        // The center position is a random point in the view:
        var center = Point.random() * view.size;
        var placed = symbol.place(center);
        placed.scale(i / count + 0.01);
        placed.data = {
            vector: new Point({
                angle: Math.random() * 360,
                length : (i / count) * Math.random() / 5
            })
        };
    }

    var vector = new Point({
        angle: 45,
        length: 0
    });


    return function(vector) {
        // Run through the active layer's children list and change
        // the position of the placed symbols:
        earthImg.position += earthImg.data.vector;
        keepInView(earthImg);

        var layer = project.activeLayer;
        for (var i = 0; i < count; i++) {
            var item = layer.children[i];
            var size = item.bounds.size;
            var length = vector.length / 10 * size.width / 10;
            item.position += vector.normalize(length) + item.data.vector;
            keepInView(item);
        }
        earthImg.insertAbove(layer.children[count-1]);
    };
};

var whap = new Raster('whap');
whap.visible = false;
var moveRainbow = new function() {
    var paths = [];
    var colors = ['red', 'orange', 'red', 'orange', 'red'];
    for (var i = 0; i < colors.length; i++) {
        var path = new Path({
            fillColor: colors[i]
        });
        paths.push(path);
    }

    var count = 30;
    var group = new Group(paths);
    var headGroup;

    var vector = (view.center - position) / 10;
    if (vector.length < 5)
        vector.length = 5;

    var handImg = new Raster('hand');
    handImg.position = view.center;
    // handImg.scale(0.2);

    var eyePosition = new Point();
    var eyeFollow = (Point.random() - 0.5);
    var blinkTime = 200;

    function createHead(vector, count) {
        var eyeVector = (eyePosition - eyeFollow);
        eyePosition -= eyeVector / 4;
        if (eyeVector.length < 0.00001)
            eyeFollow = (Point.random() - 0.5);
        if (headGroup)
            headGroup.remove();
        var top = paths[0].lastSegment.point;
        var bottom = paths[paths.length - 1].firstSegment.point;
        var radius = (bottom - top).length / 2;
        var circle = new Path.Circle({
            center: top + (bottom - top) / 2,
            radius: radius,
            fillColor: 'black'
        });
        circle.scale(vector.length / 100, 1);
        circle.rotate(vector.angle, circle.center);

        innerCircle = circle.clone();
        innerCircle.scale(0.5);
        innerCircle.fillColor = (count % blinkTime < 3)
            || (count % (blinkTime + 5) < 3) ? 'black' : 'white';
        if (count % (blinkTime + 40) == 0)
            blinkTime = Math.round(Math.random() * 40) + 200;
        var eye = circle.clone();
        eye.position += eyePosition * radius;
        eye.scale(0.15, innerCircle.position);
        eye.fillColor = 'black';
        headGroup = new Group(circle, innerCircle, eye);
    }
    
    return function(vector, event) {
        var vector = (view.center - position) / 10;

        if (vector.length < 5)
            vector.length = 5;
        count += vector.length / 100;
        group.translate(vector);
        var rotated = vector.rotate(90);
        var middle = paths.length / 2;
        for (var j = 0; j < paths.length; j++) {
            var path = paths[j];
            // resizing with time below:
            // var unitLength = vector.length * (2 + Math.sin(event.count / 10)) / 2;
            var unitLength = 10 * (2 + Math.sin(event.count / 10)) / 2;
            var length = (j - middle) * unitLength + 1;
            var top = view.center + rotated.normalize(length);
            var bottom = view.center + rotated.normalize(length + unitLength);
            path.add(top);
            path.insert(0, bottom);
            if (path.segments.length > 75) {
                var index = Math.round(path.segments.length / 2);
                path.segments[index].remove();
                path.segments[index - 1].remove();
            }
            path.smooth();
        }

        // handImg.scale(vector.length/100);
        handImg.rotate(rotated.angle - lastAngle);
        lastAngle = rotated.angle;
        if(earthImg.visible && handImg.hitTest(earthImg.position)){
            // Temporarily show "Wha-POW!" thing.
            whap.position = view.center + (0, -60);
            whap.visible  = true;
            earthImg.visible = false;
            whap.bringToFront();
        }

        // createHead(vector, event.count);
    }
}
