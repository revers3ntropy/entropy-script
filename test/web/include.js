const entropyScriptLink = document.createElement('script');

entropyScriptLink.setAttribute('src', '../../build/latest.js');

document.head.appendChild(entropyScriptLink);

entropyScriptLink.onload = async () => {

    /**
     * Runs EntropyScript code
     * @param {string} text
     */
    window.runES = (text) => {
        es.run(text);
    };

    if ('onESLoad' in window && typeof window.onESLoad === 'function') {
        window.onESLoad(es);
    }

    const scripts = [
        ...document.querySelectorAll('script[type=es]'),
        ...document.querySelectorAll('script[type=entropy-script]')
    ];

    const res = await es.init(
        console.log,
        (msg, cb) => cb(prompt()),
        false
    );

    if (res instanceof es.ESError) {
        console.log(res.str);
        return;
    }

    for (const s of scripts) {
        const url = s.getAttribute('src');

        let text;
        if (url) {
            text = await (await (fetch(url))).text();
        } else {
            text = s.innerText;
        }

        const env = new es.Context();
        env.parent = es.global;

        const res = es.run(text, {
            env,
            fileName: url || 'inline',
            currentDir: url
        });
        if (res.error) {
            console.log(res.error.str);
        }
    }
};