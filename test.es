let v2 = class {};
const v2 = class {
	init (x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	add_ (v: v2): v2 {
		this.x += v.x;
		this.y += v.y;
		return this;
	}
};

var pos = v2(2, 1);
pos.add_(v2(3, 4));