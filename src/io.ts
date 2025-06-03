interface AuthBody {
    username: string;
    password: string;
}

export async function ioAuth(username: string, password: string): Promise<string> {
    if (!username || !password) {
        throw new Error('Missing TETRIO_USERNAME or TETRIO_PASSWORD in environment variables');
    }

    const authBody: AuthBody = { username, password };

    const response = await fetch('https://tetr.io/api/users/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(authBody),
    });

    if (!response.ok) {
        throw new Error(`Authentication request failed with status ${response.status}`);
    }

    const json = await response.json();
    if (!json.token) {
        throw new Error('Token not found in response');
    }

    return json.token;
}

export enum DownloadErrorType {
    Unsuccessful = 'Unsuccessful',
    Corrupted = 'Corrupted',
    Request = 'Request',
}

export class DownloadError extends Error {
    constructor(public type: DownloadErrorType, public cause?: unknown) {
        const message =
            type === DownloadErrorType.Request && cause instanceof Error
                ? `Replay download error: ${cause.message}`
                : type === DownloadErrorType.Unsuccessful
                    ? 'Replay unable to be downloaded'
                    : 'Replay downloaded but corrupted';

        super(message);
    }
}

export async function getUserId(username: string) {
    try {
        const resp = await fetch(`https://ch.tetr.io/api/users/${username}`)
        const js = await resp.json()
        const id = js["data"]["_id"]
        if(typeof id === "string"){
            if(id.length > 0){
                return id
            }
        }
    } catch (e) {
    }
}

export async function downloadReplay(id: string, token: string): Promise<string> {
    const url = `https://tetr.io/api/games/${id}`;
    let response: Response;

    try {
        response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
    } catch (e) {
        throw new DownloadError(DownloadErrorType.Request, e);
    }

    if (!response.ok) {
        throw new DownloadError(DownloadErrorType.Request, new Error(`Status ${response.status}`));
    }

    let json: any;
    try {
        json = await response.json();
    } catch {
        throw new DownloadError(DownloadErrorType.Corrupted);
    }

    if (!json.success || typeof json.success !== 'boolean' || json.success !== true) {
        throw new DownloadError(DownloadErrorType.Unsuccessful);
    }

    if (!json.game || typeof json.game !== 'object') {
        throw new DownloadError(DownloadErrorType.Corrupted);
    }

    return JSON.stringify(json.game);
}