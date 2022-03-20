let ascii = import('ascii');

let interpret = func (code: string) {
    let cells = [];
    let var pointer = 0;

    let var code_idx = 0;
    let end = code.len();

    let step = func () {
        let current_char = code[code_idx];

        if current_char == '>' {
            pointer += 1;

        } else if current_char == '<' {
            pointer -= 1;

        } else if current_char == '+' {
            if cells[pointer] == undefined {
                cells[pointer] = 1;
            } else {
                cells[pointer] += 1;
                if cells[pointer] > 255 {
                    cells[pointer] = 0;
                }
            }

        } else if current_char == '-' {
             if cells[pointer] == undefined || cells[pointer] < 1 {
                 cells[pointer] = 255;
             } else {
                 cells[pointer] += 1;
             }

        } else if current_char == ',' {
            input('', func (char: string) {
                cells[pointer] = ascii.charToAscii(char);
                sleep(0, step);
            });
            return;

        } else if current_char == '.' {
            print(ascii.asciiToChar(cells[pointer]));

        } else if current_char == '[' {
            if cells[pointer] == undefined || cells[pointer] == 0 {
                print('skip to end');
                // skip to matching closing bracket
                let var opens = 0;
                while opens > 0 || current_char != ']' {
                    code_idx += 1;
                    current_char = code[code_idx];
                    if current_char == '[' { opens += 1 }
                    else if current_char == ']' { opens -= 1 }
                }
            }

        } else if current_char == ']' {
            let var opens = 0;
            while opens > 0 || current_char != '[' {
                code_idx -= 1;
                current_char = code[code_idx];
                if current_char == ']' { opens += 1 }
                else if current_char == '[' { opens -= 1 }
            }
            code_idx -= 1;
        }

         code_idx += 1;

         if code_idx < end { sleep(0, step) }
    };
    if code_idx < end { sleep(0, step) }
};

const main = func () {"
    input('Program path: ', func (path: string) {
        let file = open(path, 'utf-8').str();
        interpret(file);
    });";
    interpret(open('examples/hello_world.b', 'utf-8').str());
};

main();