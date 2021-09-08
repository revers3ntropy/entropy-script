let describe = func (name, tests) {

}

let test = func (name, test) {

}

let expect = func (val1) {
    return {
        toEqual: func (val2) {
            return val1 == val2;
        },
        toBeGreaterThan: func (val2) {
            return val1 > val2;
         },
        toBeLessThan: func (val2) {
            return val1 < val2;
        },
    }
}
