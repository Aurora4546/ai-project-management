const https = require('https');
const fs = require('fs');

const imageUrl = "https://lh3.googleusercontent.com/aida/ADBb0ugcwQrlid4xM5fwO-pMu5SgUfYLhQf4w-RmQ8b5AgoACn9rsH21ujdQFFl5DFNgJKLQ3F4r-kDt-fOIOtkiT9dreR1bipHVjQ4CUBJ-pK-kCiZ-AvKGBQpongPopS9ju6O9osOJuaFXFjmBBDdcgFwqzDB3NTkSW6K9hI2NsvTEbKQvtTECXzC20JKyj8repvkQk1CVrPXTgNiN19FJ59uvhNMuxTJIfonZF1vuRx4bJc87r0XfnhxRro4c";

const htmlUrl = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2MzMWY5YzBjYjFjNTQxMWY4YmEzZWMxMmE3ZGMwZWNhEgsSBxDepuKl6REYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjAxMjQ5NDAzNTQyMTMwMjQxNQ&filename=&opi=89354086";

https.get(imageUrl, (res) => {
  const file = fs.createWriteStream('agile-board.png');
  res.pipe(file);
});

https.get(htmlUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('agile-board.html', data);
    console.log("Downloads complete!");
  });
});
