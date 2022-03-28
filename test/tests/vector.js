const {expect, file} = require( '../testFramework');
file('examples/vector');

expect(
	[
		'v2',
		{x: 0, y: 0, add: '<Func>', str: '<Func>', clone: '<Func>'},
		{x: 3, y: 4, add: '<Func>', str: '<Func>', clone: '<Func>'},
		'3, 4',
		true,
		{x: 4, y: 5, add: '<Func>', str: '<Func>', clone: '<Func>'},
		'3, 4',
		'4, 5'
	],

	`
    let v2 = class {
        init (x: Num, y: Num) {
            this.x = x;
            this.y = y;
        }
        
        add (v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        
        str (): Str {
            return this.x.str() + ', ' + this.y.str();
        }
        
        clone () {
			return v2(this.x, this.y);
        }
    };
    
    let var pos = v2(0, 0);
    pos.add(v2(3, 4));
    pos.str();
    pos.clone() == pos;
    let clone = pos.clone().add(v2(1, 1));
    pos.str();
    clone.str();
`);