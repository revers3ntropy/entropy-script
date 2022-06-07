/*
    Stand-alone script to be imported where you want to use EntropyScript in the browser.
    Import with a script tag in the head of the HTML document:
    <script src="path/to/dist.js"></script>

    and then write ES like this:
    <script type=es>
        print('hello world');
    </script>
*/

const scriptTypeNames = ['es', 'entropy-script', 'entropyscript', 'ES'];
// this is my domain
const CDNDomain = 'https://entropygames.io';
const CDNPath = 'entropy-script/node_modules/entropy-script/build/latest.js';

async function onload () {
    // add runES function to window, which can then be used in JS where needed
    // (or even in ES with the DOM module)
    window.runES = (text) => {
        es.run(text);
    };

    // look for an 'onESLoad' function, and run it
    if ('onESLoad' in window && typeof window.onESLoad === 'function') {
        window.onESLoad(es);
    }

    // look for scripts with a 'type' attribute specified above.
    const scripts = [];
    for (let type of scriptTypeNames) {
        scripts.push(...document.querySelectorAll(`script[type=${type}]`));
    }

    // initialsie entropy-script
    const res = await es.init(
        console.log,
        (msg, cb) => cb(prompt()),
        false
    );

    // check for error in initialisation and throw it if found
    if (res instanceof es.ESError) {
        console.error(res.str);
        return;
    }

    // loop over the scripts, running their code
    for (const s of scripts) {
        const url = s.getAttribute('src');

        let text;
        if (url) {
            text = await (await (fetch(url))).text();
        } else {
            text = s.innerText;
        }

        // new context for each script, means globally accessable variables by default
        // use 'window.[] = ?'
        // or 'let global a = ?'
        const env = new es.Context();
        env.parent = es.global;

        const res = es.run(text, {
            env,
            // inline for scripts which do not have a URL
            fileName: url || 'inline',
            currentDir: url
        });
        if (res.error) {
            console.error(res.error.str);
        }
    }
}

function main () {
    // create script element
    const entropyScriptLink = document.createElement('script');
    // link script to the CDN
    entropyScriptLink.setAttribute('src', `${CDNDomain}/${CDNPath}`);
    // add script to DOM
    document.head.appendChild(entropyScriptLink);
    // add onload method
    entropyScriptLink.onload = onload;
}

main();