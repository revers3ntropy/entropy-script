global mutable MyLib = namespace {
    mutable a: number = 0;
};
MyLib.a += 9;
log(MyLib.a);