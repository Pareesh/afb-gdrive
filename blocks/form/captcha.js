const workerurl = 'https://captcha-worker.pareeshgupta.workers.dev';
const sitekey = '6Ld80zIlAAAAAOBqjZObabjOqmCxXM4UH6kCX02G';

export function onCaptchaScriptLoad() {
    [...document.querySelectorAll('.g-recaptcha')].forEach((captcha) => {
        window.grecaptcha.render(captcha, {
            sitekey: sitekey,
            theme: 'dark',
            callback: onCaptchaResponse
        });
    });
}

export function onCaptchaResponse(token) {
    verifyCaptcha(token).then((isHuman) => {
        if (isHuman) {
            const success = document.createElement('div');
            success.innerHTML = 'Server side captcha validation Successful, you can proceed with form submission';
            document.querySelector('form').appendChild(success);
        } else {
            const error = document.createElement('div');
            error.innerHTML = 'Server side captcha validation failed';
            document.querySelector('form').appendChild(error);
        }
    });
}

async function verifyCaptcha(token) {
    try {
        const response = await fetch(workerurl, {
            method: "POST",
            headers: { 
                'g-recaptcha': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: 'recaptchav2' }),
        });

        if (response.status === 202) {
            return true;
        } else {
            console.error('Captcha validation failed with statuscode: ' + response.status);
            return false;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
}