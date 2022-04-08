module('test', namespace {
    func assert (value: Bool) {
        if !value {
            throw(TestFailed());
        }
    }
})