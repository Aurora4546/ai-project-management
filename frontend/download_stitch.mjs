import fs from 'fs';
import https from 'https';

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAzOThiNGNkOGZhMDQ3MTNhM2FkNjU1MGZkMTljYThlEgsSBxDepuKl6REYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAxMjQ5NDAzNTQyMTMwMjQxNQ&filename=&opi=89354086";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('stitch_login.html', data);
        console.log('Downloaded stitch_login.html successfully');
    });
}).on('error', (e) => {
    console.error(e);
});
