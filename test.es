let v2 = type;
v2 = class {
	init (x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	add (v: v2): v2 {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	scale (n: number): v2 {
		this.x *= n;
		this.y *= n;
		return this;
	}

	clone (): v2 {
		return v2(this.x, this.y);
	}

	str (): string {
		return this.x + ', ' + this.y;
	}
};

var pos = v2(0, 0);
log(pos);
log(pos.x, pos.y);
log(pos.add(v2(1, 2)));
log(pos == pos.add(v2(1, 2)));