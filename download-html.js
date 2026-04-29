const https = require('https');
const fs = require('fs');

const url = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MzMWY5YzBjYjFjNTQxMWY4YmEzZWMxMmE3ZGMwZWNhEgsSBxDepuKl6REYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAxMjQ5NDAzNTQyMTMwMjQxNQ&filename=&opi=89354086";

https.get(url, (res) => {
  const file = fs.createWriteStream('stitch-agile-node.html');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete');
  });
}).on('error', (err) => {
  console.error("Error: ", err.message);
});
