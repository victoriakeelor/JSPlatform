function Level(plan) {
  // Use the length of a single row to set the width of the level
  this.width = plan[0].length;
  // Use the number of rows to set the height

  this.height = plan.length;

  // Store the individual tiles in our own, separate array
  this.grid = [];

  // Loop through each row in the plan, creating an array in our grid
  for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];

    // Loop through each array element in the inner array for the type of the tile
    for (var x = 0; x < this.width; x++) {
      // Get the type from that character in the string. It can be 'x', '!' or ' '
      // If the character is ' ', assign null.

      var ch = line[x], fieldType = null;

      // Use if and else to handle the two cases
      if (ch == "@")
		  this.player = new Player(new Vector(x,y));
	  else if (ch == "x")
        fieldType = "wall";
      // Because there is a third case (space ' '), use an "else if" instead of "else"
      else if (ch == "!")
        fieldType = "lava";
	  else if (ch == "y")
		  fieldType = "floater";

      // "Push" the fieldType, which is a string, onto the gridLine array (at the end).
      gridLine.push(fieldType);
    }
    // Push the entire row onto the array of rows.
    this.grid.push(gridLine);
  }
}

function Player(pos) {
	this.pos = pos.plus(new Vector(0, -0.5));
	this.size = new Vector(0.8, 1.5);
	this.speed = new Vector(0,0);
}
Player.prototype.type = "player";

function Vector(x, y) {
  this.x = x; this.y = y;
}

// Vector arithmetic: v_1 + v_2 = <a,b>+<c,d> = <a+c,b+d>
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

// Vector arithmetic: v_1 * factor = <a,b>*factor = <a*factor,b*factor>
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

// Helper function to easily create an element of a type provided 
// and assign it a class.
function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

// Main display class. We keep track of the scroll window using it.
function DOMDisplay(parent, level) {

// this.wrap corresponds to a div created with class of "game"
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  // In this version, we only have a static background.
  this.wrap.appendChild(this.drawBackground());
  
  //Track our actors
  this.actorLayer = null;
  
  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";

  // Assign a class to new row element directly from the string from
  // each tile in grid
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

DOMDisplay.prototype.drawPlayer = function() {
	var wrap = elt("div");
	var actor = this.level.player;
	var rect = wrap.appendChild(elt("div","actor"+ actor.type));
	rect.style.width = actor.size.x * scale + "px";
	rect.style.height = actor.size.y * scale + "px";
	rect.style.left = actor.pos.x * scale + "px";
	rect.style.top = actor.pos.y * scale + "px";
	
	return wrap;
	
}

DOMDisplay.prototype.drawFrame = function() {
	if(this.actorLayer)
		this.wrap.removeChild(this.actorLayer);
	this.actorLayer = this.wrap.appendChild(this.drawPlayer());
	this.scrollPlayerIntoView();
};


// Scrolls the viewport by using arrow keys
DOMDisplay.prototype.scrollPlayerIntoView = function(keys, step) {
  // Adding in arrow keys to scroll across level
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  // Change coordinates from the source to our scaled.
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

// Arrow key codes for readibility
var arrowCodes = {37: "left", 38: "up", 39: "right", 40: "down"};

// Translate the codes pressed from a key event
function trackKeys(codes) {
  var pressed = Object.create(null);

  // alters the current "pressed" array which is returned from this function. 
  // The "pressed" variable persists even after this function terminates
  // That is why we needed to assign it using "Object.create()" as 
  // otherwise it would be garbage collected

  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      // If the event is keydown, set down to true. Else set to false.
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      // We don't want the key press to scroll the browser window, 
      // This stops the event from continuing to be processed
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

// frameFunc is a function called each frame with the parameter "step"
// step is the amount of time since the last call used for animation
function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      // Set a maximum frame step of 100 milliseconds to prevent
      // having big jumps
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
var maxStep = 0.5;
Level.prototype.animate = function(step, keys) {
	while (step > 0) {
		var thisStep = Math.min(step, maxStep);
		this.player.act(thisStep, this, keys);
		step = thisStep;
	}
}

var playerSpeed = 7;
Player.prototype.movex = function(step, level, keys) {
	this.speed.x = 0;
	if (keys.left)
		this.speed.x -= playerXSpeed;
	if (keys.right)
		this.speed.x += playerXSpeed;
	var motion = new Vector(this.speed.x * step, 0);
	var newPos = this.pos.plus(motion);
	this.pos = newPos;
};

//Placeholder Code
Player.prototype.moveY = function(step, level, keys) {
	this.speed.y = 0;
	if (keys.up)
		this.speed.y += playerYSpeed;
	if (keys.down)
		this.speed.y -= playerYSpeed;
	var motion = new Vector(this.speed.y * step, 0);
	var newPos = this.pos.plus(motion);
	this.pos = newPos;
}
Player.prototype.act = function(step,level,keys) {
	this.moveX(step, level, keys);
	this.moveY(step, level, keys);
};
// This assigns the array that will be updated anytime the player
// presses an arrow key. We can access it from anywhere.
var arrows = trackKeys(arrowCodes);

// Organize a single level and begin animation
function runLevel(level, Display) {
  var display = new Display(document.body, level);

  runAnimation(function(step) {
    // Allow the viewer to scroll the level
    level.animate(step,arrows);
	display.drawFrame(step);
  });
}

function runGame(plans, Display) {
  function startLevel(n) {
    // Create a new level using the nth element of array plans
    // Pass in a reference to Display function, DOMDisplay (in index.html).
    runLevel(new Level(plans[n]), Display);
  }
  startLevel(0);
}
