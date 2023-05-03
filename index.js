import fetch from 'node-fetch'
import { getInput, info, setFailed, setOutput } from '@actions/core';
const apiUri = 'https://api.cloudways.com/api/v1';

async function getOauthToken() {
    const body = {
        email: getInput('email'),
        api_key: getInput('api-key')
    };

    const options = {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return await fetch(`${ apiUri }/oauth/access_token`, options).then(res => res.json());
}

async function deployChanges(token) {
    const body = {
        server_id: getInput('server-id'),
        app_id: getInput('app-id'),
        branch_name: getInput('branch-name'),
        deploy_path: getInput('deploy-path'),
    };

    const options = {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ token }`
        }
    };

    return await fetch(`${ apiUri }/git/pull`, options).then(response => {
        return response.json().then(data => {
            return {
                ok: response.ok,
                code: response.status,
                body: data
            }
        });
    });
}

async function run() {
    try {
        const oauthToken = await getOauthToken();

        if (oauthToken.error) {
            throw new Error(oauthToken.error_description);
        }

        if (!oauthToken.access_token || oauthToken.access_token === '') {
            throw new Error('The access token does not exist.');
        }

        await deployChanges(oauthToken.access_token).then(response => {
            if (!response.ok) {
                throw new Error(response.body.error_description);
            }

            info(`Success. Operation ID: ${ response.body.operation_id }`);
            setOutput('operation', response.body.operation_id);
        });
    } catch (error) {
        setFailed(error.message);
    }
}

run();
