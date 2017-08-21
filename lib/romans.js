
/*
 M 1000
 CM 900
 D 500
 CD 400
 C 100
 XC 90
 L 50
 XL 40
 X 10
 IX 9
 V 5
 IV 4
 I 1
*/

var RomanNumber = function(i) {
	var legal = "MDCXLXVI";
	this.state = i;

	// check if the user put new or not
	if (!this.toRoman) {
		return new RomanNumber(i);
	}

	if (typeof(this.state) === "string") {
		this.state = this.state.toUpperCase();
		var chars = this.state.split("");
		chars.map(function(c) {
			if (legal.indexOf(c) < 0) {
				throw new Error("Not a valid roman numerical");
			}
		});
		this.intValue = this.toNumber();
		this.stringValue = this.state;
	} else {
		this.state = parseInt(this.state);
		if (isNaN(this.state) || this.state === 0) {
			throw new Error("Not a number");
		}
	}
	if (typeof(this.state) === "number") {
		this.intValue = this.state;
		this.stringValue = this.toRoman();
	}

	if (this.toInt() > 3999  || this.toInt() < 1) {
		throw new Error("Only allowed range 1-3999");
	}
};

RomanNumber.prototype.toInt = function() {
	return this.intValue;
};

RomanNumber.prototype.toString = function() {
	return this.stringValue;
};

RomanNumber.prototype.toNumber = function() {
	var astring = this.state;
	if (typeof(astring) !== "string") {
		return undefined;
	}
	var work = astring.split("");
	var abnormals = { "CM": 900, "CD": 400, "XC": 90, "XL": 40, "IX": 9, "IV": 4};
	var normals = { "M": 1000,"D": 500, "C": 100, "L": 50, "X": 10, "V": 5, "I": 1};
	var not_done = true;
	var reply = 0;

	while (not_done) {
		var dual_char, single_char;
		var oldreply = reply;
		if (work.length >= 2) {
			dual_char = work[0]+work[1];
		}
		if (work.length >= 1) {
			single_char = work[0];
		}

		if (abnormals.hasOwnProperty(dual_char)) {
			reply += abnormals[dual_char];
			work.shift();
			work.shift();
		} else {
			if (normals.hasOwnProperty(single_char)) {
				reply += normals[single_char];
				work.shift();
			}
		}

		if (work.length === 0) {
			not_done = false;
		}
		if (oldreply === reply) { // illegal characters, no increase
			not_done = false;
		}
	}
	return reply;
};

RomanNumber.prototype.toRoman = function() {
	var anumber = this.state;
	var reply = "";
	anumber = parseInt(anumber);
	var numbers = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
	var letters = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

	for (var i = 0, l = numbers.length; i < l; i++) {
		while (anumber >= numbers[i]) {
			reply += letters[i];
			anumber -= numbers[i];
		}
	}

	return reply;
};

module.exports = RomanNumber;